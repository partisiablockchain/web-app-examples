# ML-MPC: Privacy-Preserving Machine Learning with Multi-Party Computation

This project implements a privacy-preserving machine learning system using Multi-Party Computation (MPC) on the Partisia Blockchain. The system consists of three main components:

1. **Smart Contracts (Rust)**: Implements the MPC protocol and model inference on the Partisia Blockchain
2. **Model Training (Python)**: Handles model training and conversion to MPC-compatible format
3. **Frontend UI (TypeScript/Next.js)**: Provides a user interface for model interaction

## Architecture Overview

The system works as follows:

1. The model is trained in Python using standard ML libraries
2. The trained model is converted to a format compatible with MPC operations
3. The model parameters are deployed to the Partisia Blockchain as smart contracts
4. Users can interact with the model through the frontend UI
5. All computations are performed using MPC, ensuring data privacy

## Project Structure

```
ml-mpc/
├── rust-classification-smart-contracts/  # Smart contracts for MPC
├── ml-training-python/                  # Model training and conversion
└── frontend/                            # Next.js frontend application
```

## Getting Started

1. First, train your model using the Python scripts in `ml-training-python/`
2. Deploy the smart contracts to Partisia Blockchain using the Rust code
3. Start the frontend application to interact with the model

For detailed instructions on each component, please refer to the README files in each directory.

## Prerequisites

- Rust (latest stable version)
- Python 3.8+
- Node.js 18+
- Partisia Blockchain CLI tools
- Docker (optional, for containerized deployment)

## Development Setup

1. Clone the repository
2. Install dependencies for each component:

   ```bash
   # For Rust contracts
   cd rust-classification-smart-contracts
   cargo build

   # For Python training
   cd ml-training-python
   pip install -r requirements.txt

   # For frontend
   cd frontend
   npm install
   ```

## Security Considerations

- All model parameters are encrypted and split between multiple parties
- Input data is never exposed in plain text
- Computations are performed using secure MPC protocols
- The system is designed to be resistant to various cryptographic attacks

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
