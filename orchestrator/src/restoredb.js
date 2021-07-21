const { DownloaderHelper } = require('node-downloader-helper');
const jaguar = require('jaguar');
const fsExtra = require('fs-extra');
const debug = require('debug')('restoredb');

class RestoreDb {
  constructor (orchestrator) {
    this.orchestrator = orchestrator;

    // Database restore default variables
    this.downloadRunning = false;
    this.downloadPaused = false;
    this.download = false;
    this.downloadSuccess = false;
    this.downloadError = '';
    this.downloadState = 'NONE';
    this.databaseRestoreRunning = false;
    this.databaseRestoreSuccess = false;
    this.databaseRestoreError = '';
    this.databaseRestoreProgress = 0;
    this.downloadInfo = '';
    this.backupURL = '';
    this.dataBasePath = '';
  };

  // Return database download statistics
  async downloadStats () {
    const stats = await this.download.getStats();
    stats.downloadRunning = this.downloadRunning;
    stats.downloadPaused = this.downloadPaused;
    stats.downloadSuccess = this.downloadSuccess;
    stats.downloadState = this.downloadState;
    stats.downloadError = this.downloadError;
    stats.backupURL = this.backupURL;
    stats.dataBasePath = this.dataBasePath;
    return JSON.stringify(stats);
  }

  // Init all necessary variables and create event handlers
  prepareDownloadHandler () {
    try {
      // Get url and path from service instance
      this.backupURL = this.orchestrator.service.serviceBackupURL();
      this.dataBasePath = this.orchestrator.service.serviceDatabasePath();

      // Create download object if is not already created
      if (!this.download) {
        this.download = new DownloaderHelper(this.backupURL, '/', { override: true, retry: { maxRetries: 5, delay: 5000 } });

        // If error occured during file download
        this.download.on('error', (error) => {
          const errorMsg = `Download Error! Error: ${error}.`;
          console.log(errorMsg);
          this.downloadError = errorMsg;
          this.downloadRunning = false;
        });

        // If timeout was reached on download
        this.download.on('timeout', () => {
          const errorMsg = 'Download Error! Timeout!';
          console.log(errorMsg);
          this.downloadError = errorMsg;
          this.downloadRunning = false;
        });

        // If retry event was recieved
        this.download.on('retry', (attempt, retryOpts) => {
          const errorMsg = `Download Error! Retry #${attempt}. Delay ${retryOpts.delay} ms.`;
          console.log(errorMsg);
          this.downloadError = errorMsg;
        });

        // If downlaod state changed
        this.download.on('stateChanged', (state) => {
          console.log(`Download State Changed! State: ${state}.`);
          this.downloadState = state;
        });

        // Download success handler
        this.download.on('end', (downloadInfo) => {
          if (downloadInfo.incomplete) {
            const error = 'Download was finished but is incomplete.';
            console.log(error);
            this.downloadError = error;
            this.downloadRunning = false;
            this.downloadSuccess = false;
            return;
          }
          const fileName = this.backupURL.split('/').pop();
          if (!this.downloadRunning) {
            return;
          }
          this.downloadSuccess = true;
          console.log(`File was successfully downloaded and saved to /${fileName}...`);
          this.downloadRunning = false;
          this.downloadError = '';
        });
      }
    } catch (error) {
      debug('prepareDownloadHandler', error);
      throw error;
    }
  }

  // Restore service database
  async serviceRestoreDB (action) {
    try {
      this.prepareDownloadHandler();
      switch (action) {
        case 'download-start':
          return this.downloadStart();
        case 'download-stop':
          return await this.downloadStop();
        case 'download-pause':
          return await this.downloadPause();
        case 'download-resume':
          return this.downloadResume();
        case 'download-stats':
          return await this.downloadStats();
        case 'restore':
          return await this.restore();
        case 'restore-stats':
          return this.restoreStats();
        default:
          throw Error('Unknown action.');
      }
    } catch (error) {
      debug('serviceRestoreDB', error);
      throw error;
    }
  }

  // Executed when download start is requested
  downloadStart () {
    if (this.databaseRestoreRunning) {
      this.downloadInfo = 'You cannot download while the database restore is running!';
      console.log(this.downloadInfo);
      return this.downloadInfo;
    }

    if (this.downloadRunning) {
      this.downloadInfo = 'Download is already running!';
      console.log(this.downloadInfo);
      return this.downloadInfo;
    }
    this.downloadError = '';
    console.log(`Starting download from ${this.backupURL}...`);
    this.download.start();
    this.downloadSuccess = false;
    this.downloadRunning = true;
    this.downloadPaused = false;
    this.downloadInfo = 'Download was started!';
    console.log(this.downloadInfo);
    return this.downloadInfo;
  }

  // Executed when download stop is requested
  async downloadStop () {
    if (!this.downloadRunning) {
      this.downloadInfo = 'Download is not running!';
      console.log(this.downloadInfo);
      return this.downloadInfo;
    }
    console.log('Stopping the download...');
    await this.download.stop();
    this.downloadRunning = false;
    this.downloadPaused = false;
    this.downloadInfo = 'Download was stopped!';
    console.log(this.downloadInfo);
    return this.downloadInfo;
  }

  // Executed when download pause is requested
  async downloadPause () {
    if (!this.downloadRunning || this.downloadPaused) {
      this.downloadInfo = 'Download is not running or already paused!';
      console.log(this.downloadInfo);
      return this.downloadInfo;
    }
    console.log('Pausing the download...');
    await this.download.pause();
    this.downloadPaused = true;
    this.downloadInfo = 'Download was paused!';
    console.log(this.downloadInfo);
    return this.downloadInfo;
  }

  // Executed when download resume is requested
  downloadResume () {
    if (!this.downloadRunning || !this.downloadPaused) {
      this.downloadInfo = 'Download is not running or not paused!';
      console.log(this.downloadInfo);
      return this.downloadInfo;
    }
    console.log('Resuming the download...');
    this.downloadPaused = false;
    this.download.resume();
    this.downloadInfo = 'Download was resumed!';
    console.log(this.downloadInfo);
    return this.downloadInfo;
  }

  // Return restore process statistics
  restoreStats () {
    const stats = {};
    stats.databaseRestoreRunning = this.databaseRestoreRunning;
    stats.databaseRestoreSuccess = this.databaseRestoreSuccess;
    stats.databaseRestoreError = this.databaseRestoreError;
    stats.databaseRestoreProgress = this.databaseRestoreProgress;
    stats.backupURL = this.backupURL;
    stats.dataBasePath = this.dataBasePath;
    return JSON.stringify(stats);
  }

  // Executed when restore is requested
  async restore () {
    // Check if database was successully downloaded
    if (this.downloadRunning || !this.downloadSuccess) {
      this.downloadInfo = 'You must successfully download the database file before restore!';
      console.log(this.downloadInfo);
      return this.downloadInfo;
    }
    // Check if database restore is not already running
    if (this.databaseRestoreRunning) {
      this.downloadInfo = 'Database restore is already running.';
      console.log(this.downloadInfo);
      return this.downloadInfo;
    }

    // Start database restore
    await this.restoreDB();
    this.downloadInfo = 'Database restore was launched!';
    console.log(this.downloadInfo);
    return this.downloadInfo;
  }

  // Triggered if download was successfull
  async restoreDB () {
    try {
      // Turn off orchestrator and stop service container
      await this.restoreStartPrepare();

      // Creating filename from url
      const fileName = this.backupURL.split('/').pop();
      console.log(`Restoring database from file /${fileName}...`);

      // Removing all from dataBasePath directory
      console.log(`Removing all files from ${this.dataBasePath} directory...`);
      fsExtra.emptyDirSync(`${this.dataBasePath}`);

      // Extracting downloaded archive to dataBasePath directory
      console.log(`Extracting /${fileName} into ${this.dataBasePath}.`);
      const extract = jaguar.extract(`/${fileName}`, this.dataBasePath);
      this.databaseRestoreProgress = 0;

      // When extraction starts
      extract.on('file', (name) => {
        console.log(`Extracting file: ${name}...`);
      });

      // To be able to track extraction progress
      extract.on('progress', (percent) => {
        debug('restoreDB', `Extracting progress: ${percent} %`);
        this.databaseRestoreProgress = percent;
      });

      // If an error occured during extraction process
      extract.on('error', (error) => {
        const errorMsg = `Extracting file error: ${error}`;
        console.log(errorMsg);
        this.databaseRestoreError = errorMsg;
        // If error remove all already extracted files in dataBasePath
        // And relaunch orchestration and service in passive mode
        fsExtra.emptyDirSync(`${this.dataBasePath}`);
        this.restoreStopPrepare();
      });

      // Extraction was successfully finished
      extract.on('end', () => {
        console.log('Extracting file success!!');
        this.databaseRestoreSuccess = true;
        // If success we will relaunch orchestration and service in passive mode
        this.restoreStopPrepare();
        this.databaseRestoreError = '';
      });
    } catch (error) {
      debug('restoreDB', error);
      throw error;
    }
  }

  // Disable orchestration, heartbeat send and cleanup service before restore
  async restoreStartPrepare () {
    this.databaseRestoreRunning = true;
    this.databaseRestoreSuccess = false;
    // Disable orchestration and heartbeat send
    this.orchestrator.orchestrationEnabled = false;
    this.orchestrator.heartbeatSendEnabled = false;
    // Stopping service and removing imported keys
    await this.orchestrator.service.serviceInstance.serviceCleanUp();
    this.orchestrator.service.serviceInstance.importedKeys = [];
  }

  // Enable orchestration, hearbeat send and launche service in passive mode after restore
  async restoreStopPrepare () {
    this.databaseRestoreRunning = false;
    // Enable orchestration and heartbeat send
    this.orchestrator.orchestrationEnabled = true;
    this.orchestrator.heartbeatSendEnabled = true;
    // Start service in passive mode
    await this.orchestrator.service.serviceStart('passive');
  }
}

module.exports = { RestoreDb };