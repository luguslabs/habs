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
RUN ./target/release/archipel  build-spec --chain template > archipelTemplateSpec.json
RUN ./target/release/archipel  build-spec --chain template --raw > archipelTemplateSpecRaw.json

####################################
# Create Archipel chain docker image
####################################
FROM debian:buster-slim
WORKDIR /root/
COPY --from=builder /root/target/release/archipel .
COPY --from=builder /root/archipelTemplateSpec.json .
COPY --from=builder /root/archipelTemplateSpecRaw.json .
RUN	apt-get -y update; \
	apt-get install -y --no-install-recommends \
		libssl-dev curl
ENTRYPOINT [ "./archipel" ]
