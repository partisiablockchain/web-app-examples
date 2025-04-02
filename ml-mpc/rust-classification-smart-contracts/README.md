# ML-MPC Smart Contracts

This directory contains the Rust smart contracts that implement the Multi-Party Computation (MPC) protocol for privacy-preserving machine learning on the Partisia Blockchain.

## Overview

The smart contracts handle:

- Secure storage of model parameters
- MPC-based inference
- Result aggregation and verification
- Privacy-preserving data processing

## Project Structure

```
rust-classification-smart-contracts/
├── zk-classification/     # Main contract implementation
├── Cargo.toml            # Rust dependencies
└── Cargo.lock           # Lock file for dependencies
```

## Prerequisites

- Rust (latest stable version)
- Partisia Blockchain CLI tools
- Docker (optional, for containerized deployment)

## Building the Contracts

1. Install Rust dependencies:

   ```bash
   cargo build
   ```

2. Run tests:
   ```bash
   cargo test
   ```

## Contract Deployment

1. Ensure you have your Partisia Blockchain credentials configured
2. Deploy the contract:
   ```bash
   cargo run --release
   ```

## Contract Architecture

### Main Components

1. **Model Storage Contract**

   - Securely stores encrypted model parameters
   - Handles parameter updates and versioning

2. **MPC Protocol Contract**

   - Implements the MPC protocol for secure computation
   - Manages party coordination and result aggregation

3. **Result Verification Contract**
   - Verifies computation results
   - Handles result distribution to authorized parties

## Integration with Python Training

The smart contracts expect model parameters in a specific format. The Python training scripts in `ml-training-python/` handle the conversion of trained models to this format.

## Security Considerations

- All sensitive data is encrypted using MPC protocols
- Contract access is controlled through permission systems
- Regular security audits are recommended
- Follow best practices for key management

## Development Guidelines

1. Use the provided test suite for contract validation
2. Follow Rust best practices and coding standards
3. Document all public interfaces
4. Include unit tests for new functionality

## Troubleshooting

Common issues and solutions:

1. Build failures: Check Rust version and dependencies
2. Deployment errors: Verify blockchain credentials
3. Runtime errors: Check contract logs and state

## Contributing

Please refer to the main project README for contribution guidelines.
