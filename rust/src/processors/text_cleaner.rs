pub fn clean_text(input: &str) -> String {
    let cleaned = input
        .replace("\u{00a0}", " ")
        .replace('\r', "")
        .replace('\t', " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    cleaned.trim().to_string()
}
