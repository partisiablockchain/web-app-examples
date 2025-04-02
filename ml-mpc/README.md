# ML-MPC: Privacy-Preserving Machine Learning

A privacy-preserving machine learning system using Multi-Party Computation (MPC) on the Partisia Blockchain. This project demonstrates how to build a secure ML system where model parameters and user data remain private during inference.

## Project Structure

```
ml-mpc/
├── frontend/          # Next.js frontend application
├── backend/          # Python ML training and model conversion
├── contracts/        # Rust smart contracts for MPC
└── docs/            # Additional documentation
```

## Components

### Frontend (Next.js)
- User interface for model interaction
- Secure data input handling
- Real-time result visualization
- Integration with smart contracts

### Backend (Python)
- Model training pipeline
- Data preprocessing
- Model conversion to MPC format
- Parameter encryption

### Smart Contracts (Rust)
- MPC protocol implementation
- Secure parameter storage
- Privacy-preserving inference
- Result verification

## Getting Started

1. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Configure the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Build the smart contracts:
   ```bash
   cd contracts
   cargo build
   ```

## Development Workflow

1. Train and prepare the model using the Python backend
2. Deploy the model parameters to the blockchain
3. Build and deploy the smart contracts
4. Start the frontend application
5. Test the complete system

## Security Features

- Privacy-preserving model inference
- Encrypted parameter storage
- Secure data transmission
- Zero-knowledge proofs
- Multi-party computation

## Prerequisites

- Node.js 18+
- Python 3.8+
- Rust (latest stable)
- Partisia Blockchain CLI
- Docker (optional)

## Environment Setup

1. Create `.env` files in each component:
   ```bash
   # frontend/.env
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
   NEXT_PUBLIC_NODE_URL=your_node_url

   # backend/.env
   MODEL_PATH=path_to_model
   TRAINING_DATA_PATH=path_to_data

   # contracts/.env
   PRIVATE_KEY=your_private_key
   NODE_URL=your_node_url
   ```

## Testing

1. Frontend tests:
   ```bash
   cd frontend
   npm run test
   ```

2. Backend tests:
   ```bash
   cd backend
   python -m pytest
   ```

3. Contract tests:
   ```bash
   cd contracts
   cargo test
   ```

## Deployment

1. Deploy smart contracts:
   ```bash
   cd contracts
   cargo run --release
   ```

2. Deploy frontend:
   ```bash
   cd frontend
   npm run build
   npm run start
   ```

## Contributing

Please refer to the main repository README for contribution guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
