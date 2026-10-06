use pyo3::prelude::*;

mod cache;
mod processors;

#[pyfunction]
fn clean_text(input: &str) -> String {
    processors::clean_text(input)
}

#[pyfunction]
fn filter_boundaries(values: Vec<f64>, min: f64, max: f64) -> Vec<f64> {
    processors::filter_boundaries(values, min, max)
}

#[pyfunction]
fn validate_totals(items: Vec<f64>, tax: f64, total: f64) -> bool {
    processors::validate_totals(items, tax, total)
}

#[pyfunction]
fn bloom_contains(key: &str, fp: Vec<u8>) -> bool {
    cache::bloom_contains(key, fp)
}

#[pymodule]
fn pdf_json_parser2_premium(_py: Python, m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(clean_text, m)?)?;
    m.add_function(wrap_pyfunction!(filter_boundaries, m)?)?;
    m.add_function(wrap_pyfunction!(validate_totals, m)?)?;
    m.add_function(wrap_pyfunction!(bloom_contains, m)?)?;
    Ok(())
}
