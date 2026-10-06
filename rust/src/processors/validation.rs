pub fn filter_boundaries(values: Vec<f64>, min: f64, max: f64) -> Vec<f64> {
    values
        .into_iter()
        .filter(|value| value.is_finite() && *value >= min && *value <= max)
        .collect()
}

pub fn validate_totals(items: Vec<f64>, tax: f64, total: f64) -> bool {
    let subtotal: f64 = items.iter().sum();
    let computed_total = subtotal + tax;
    (computed_total - total).abs() < 0.01
}
