use create_type_spec_derive::CreateTypeSpec;
use pbc_zk::*;

/// Representation of internal vertices.
#[derive(SecretBinary, Debug, Clone, CreateTypeSpec)]
pub struct InternalVertex {
    /// The secret-shared feature index
    feature: Sbu8,
    /// The secret-shared threshold value
    threshold: Sbi16,
}

/// Representation of leaf vertices. 
#[derive(SecretBinary, Debug, Clone, CreateTypeSpec)]
pub struct LeafVertex {
    /// One-hot classification for up to 8 personalities
    /// e.g. [1,0,0,0,0,0,0,0] => personality #0
    ///      [0,1,0,0,0,0,0,0] => personality #1
    classification: [Sbu1; 8],
}

/// Input model (decision tree classifier) used for evaluation.
#[derive(SecretBinary, Debug, Clone, CreateTypeSpec)]
pub struct Model {
    internals: [InternalVertex; 7],
    leaves: [LeafVertex; 8],
}

/// Input sample to be classified.
#[derive(SecretBinary, Debug, Clone, CreateTypeSpec)]
pub struct Sample {
    values: [Sbi16; 10],
}

/// Evaluates the decision tree classifier on the input sample.
///
/// ### Arguments:
///
/// * model_id: Input model identifier
/// * sample_id: Input sample identifier
///
/// ### Returns:
///
/// Final result (predicted class) of evaluating the model on the given input sample.
///
#[zk_compute(shortname = 0x61)]
pub fn evaluate(model_id: SecretVarId, sample_id: SecretVarId) -> [Sbu1; 8] {
    let model: Model = load_sbi::<Model>(model_id);
    let sample: Sample = load_sbi::<Sample>(sample_id);

    let vertex_evaluation: [Sbu1; 7] =
        evaluate_internal_vertices(model.internals, sample.values);
    let path_evaluation: [Sbu1; 8] = evaluate_paths(vertex_evaluation);

    // Now do multi-class predict, returning an 8-bit vector
    let predicted_class: [Sbu1; 8] = predict_class(path_evaluation, model.leaves);

    predicted_class
}

/// Performs a zk computation on secret-shared data to compare value from the input sample to
/// threshold value in internal vertex of the decision tree. All vertices are evaluated to ensure
/// privacy, not just the ones corresponding to the actual path taken by the input sample.
///
/// ### Arguments:
///
/// * internal_vertices: Internal vertices of the input model
/// * sample: Input sample
///
/// ### Returns:
///
/// Vector of secret-shared bits representing whether left or right path was taken from each
/// internal vertex. True represents left (value is equal to or below threshold), false represents
/// right (value is above threshold).
///
fn evaluate_internal_vertices(
    internal_vertices: [InternalVertex; 7],
    sample: [Sbi16; 10],
) -> [Sbu1; 7] {
    let mut result: [Sbu1; 7] = [Sbu1::from(false); 7];

    for i in 0usize..7usize {
        let value: Sbi16 = lookup_in_sbi8_array(sample, internal_vertices[i].feature);

        if value <= internal_vertices[i].threshold {
            result[i] = Sbu1::from(true);
        }
    }

    result
}

/// Performs a zk computation on secret-shared data to evaluate the paths through the decision tree.
/// All paths are evaluated to ensure privacy, not just the one taken by the input sample.
/// Hardcoded solution for now.
///
/// ### Arguments:
///
/// * vertex_evaluation: Vector of secret-shared bits representing internal vertex evaluations
///
/// ### Returns:
///
/// One-hot vector of secret-shared bits representing whether input sample ended in each leaf vertex.
/// True if sample took the path ending in the vertex, false if not.
///
fn evaluate_paths(vertex_evaluation: [Sbu1; 7]) -> [Sbu1; 8] {
    let result: [Sbu1; 8] = [
        vertex_evaluation[0] & vertex_evaluation[1] & vertex_evaluation[2],
        vertex_evaluation[0] & vertex_evaluation[1] & !vertex_evaluation[2],
        vertex_evaluation[0] & !vertex_evaluation[1] & vertex_evaluation[3],
        vertex_evaluation[0] & !vertex_evaluation[1] & !vertex_evaluation[3],
        !vertex_evaluation[0] & vertex_evaluation[4] & vertex_evaluation[5],
        !vertex_evaluation[0] & vertex_evaluation[4] & !vertex_evaluation[5],
        !vertex_evaluation[0] & !vertex_evaluation[4] & vertex_evaluation[6],
        !vertex_evaluation[0] & !vertex_evaluation[4] & !vertex_evaluation[6],
    ];

    result
}

/// Performs a zk computation on secret-shared data to get the final classification result. Takes
/// elementwise logical AND between one-hot vector of path evaluations and vector of classes in
/// leaf vertices. Then, takes logical OR of resulting vector to obtain the final output.
///
/// ### Arguments:
///
/// * path_evaluation: Vector of secret-shared bits representing whether input sample ended in each leaf vertex
/// * leaf_vertices: Leaf vertices of the input model
///
/// ### Returns:
///
/// Final result (predicted class) of evaluating the model on the given input sample.
///
#[allow(clippy::needless_range_loop, clippy::assign_op_pattern)]
fn predict_class(path_evaluation: [Sbu1; 8], leaf_vertices: [LeafVertex; 8]) -> [Sbu1; 8] {
    let mut final_class = [Sbu1::from(false); 8];

    for leaf_idx in 0..8usize {
        // Is this leaf's path taken?
        let path_bit = path_evaluation[leaf_idx]; // Sbu1
        // Combine each classification bit
        for bit_idx in 0..8usize {
            let leaf_bit = leaf_vertices[leaf_idx].classification[bit_idx]; // Sbu1
            // partial = path_bit & leaf_bit
            let partial = path_bit & leaf_bit;
            // final = final OR partial
            final_class[bit_idx] = final_class[bit_idx] | partial;
        }
    }

    final_class
}

/// Performs lookup in an array of Sbi16, using a Sbu8 as index.
fn lookup_in_sbi8_array(arr: [Sbi16; 10], wanted_index: Sbu8) -> Sbi16 {
    let mut result: Sbi16 = Sbi16::from(0);

    for index in 0u8..10u8 {
        if wanted_index == Sbu8::from(index) {
            result = arr[index as usize];
        }
    }

    result
}