#!/bin/sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

swiftc \
    "$ROOT/macos/LocalResourceResolver.swift" \
    "$ROOT/macos/tests/LocalResourceResolverTests.swift" \
    -o "$TEST_DIR/test-local-resource-resolver"
"$TEST_DIR/test-local-resource-resolver"
