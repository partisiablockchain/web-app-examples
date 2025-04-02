# ML-MPC Model Training

This directory contains the Python scripts for training machine learning models and converting them to a format compatible with Multi-Party Computation (MPC) on the Partisia Blockchain.

## Overview

The training pipeline includes:

- Data preprocessing and preparation
- Model training with privacy-preserving techniques
- Model conversion to MPC-compatible format
- Parameter encryption and preparation for blockchain deployment

## Project Structure

```
ml-training-python/
├── data/              # Training and validation datasets
├── model/            # Trained model storage
├── scripts/          # Training and conversion scripts
├── requirements.txt  # Python dependencies
└── .env             # Environment variables
```

## Prerequisites

- Python 3.8+
- Required Python packages (install via `pip install -r requirements.txt`)
- Access to training data
- Partisia Blockchain credentials

## Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Training Process

1. Prepare your data:

   ```bash
   python scripts/prepare_data.py
   ```

2. Train the model:

   ```bash
   python scripts/train_model.py
   ```

3. Convert to MPC format:

   ```bash
   python scripts/convert_to_mpc.py
   ```

4. Deploy to blockchain:
   ```bash
   python scripts/deploy_model.py
   ```

## Model Architecture

The training pipeline supports various model architectures optimized for MPC:

- Neural Networks
- Decision Trees
- Support Vector Machines
- Linear Models

## Data Privacy

- Training data is preprocessed to remove sensitive information
- Models are trained with privacy-preserving techniques
- All data transformations are logged for audit purposes

## Integration with Smart Contracts

The converted model parameters are compatible with the Rust smart contracts:

1. Parameters are encrypted and split between parties
2. Format matches the contract's expected input
3. Version control for model updates

## Performance Optimization

Tips for optimal model performance:

1. Use appropriate batch sizes
2. Optimize feature selection
3. Regular model evaluation
4. Monitor training metrics

## Troubleshooting

Common issues and solutions:

1. Memory errors: Adjust batch size
2. Training instability: Check learning rate
3. Conversion errors: Verify model format
4. Deployment failures: Check blockchain connection

## Contributing

Please refer to the main project README for contribution guidelines.
