FROM postgres:15-alpine

# Install build dependencies
RUN apk add --no-cache \
    git \
    make \
    gcc \
    musl-dev \
    postgresql-dev \
    clang \
    llvm

# Clone and install pgvector
RUN cd /tmp && \
    git clone --branch v0.7.0 https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && \
    make install && \
    cd / && \
    rm -rf /tmp/pgvector

# Clean up build dependencies to reduce image size
RUN apk del git make gcc musl-dev clang llvm
