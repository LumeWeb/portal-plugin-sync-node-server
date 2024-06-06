#!/usr/bin/env bash

url="https://nodejs.org/dist/v20.12.2/node-v20.12.2-linux-x64.tar.xz"
output_dir="node/app"

# Helper functions
compute_node_binary_path() {
    local url="$1"
    local filename="${url##*/}" # Extract the filename from the URL
    local base_filename="${filename%.tar.xz}" # Remove the file extension

    echo "$base_filename/bin/node"
}

download_and_extract_binary() {
    local url="$1"
    local node_binary="$2"
    local output_dir="$3"

    # Download the archive
    curl -sSL "$url" | xz -d | tar -x "$node_binary" -O > "$output_dir/node"
    chmod +x "$output_dir/node"
}


# Create the output directory if it doesn't exist
mkdir -p "$output_dir"

# Compute the node binary path based on the URL
node_binary=$(compute_node_binary_path "$url")

# Download the archive and extract the node binary
download_and_extract_binary "$url" "$node_binary" "$output_dir"

echo "Node.js binary extracted successfully."