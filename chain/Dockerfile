###########################
# Archipel chain build step
###########################dock
FROM rust:buster as builder
WORKDIR /root/  
COPY . .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		g++ libssl-dev gcc clang libclang-dev make \
		git pkg-config curl time rhash
RUN ./scripts/init.sh && cargo build --release

####################################
# Create Archipel chain docker image
####################################
FROM debian:buster-slim
WORKDIR /root/
COPY --from=builder /root/target/release/archipel .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		libssl-dev
ENTRYPOINT [ "./archipel" ]
