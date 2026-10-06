pub fn bloom_contains(key: &str, fp: Vec<u8>) -> bool {
    if fp.is_empty() {
        return false;
    }

    let mut hash = 0usize;
    for byte in key.as_bytes() {
        hash = hash.wrapping_mul(131).wrapping_add(*byte as usize);
    }

    let index = hash % fp.len();
    fp[index] != 0
}
