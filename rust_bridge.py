"""Compatibility layer for the native Rust performance utilities.

This module loads the compiled PyO3 extension from the local ``rust`` crate when
available and provides pure-Python fallbacks when the native build is not yet
present. The fallback keeps the app stable while still exposing the same API.
"""

from __future__ import annotations

import importlib
import importlib.util
import subprocess
import sys
from pathlib import Path
from typing import Iterable

_PROJECT_ROOT = Path(__file__).resolve().parent
_RUST_ROOT = _PROJECT_ROOT / "rust"
_RUST_TARGETS = (
    _RUST_ROOT / "target" / "release",
    _RUST_ROOT / "target" / "debug",
)


def _candidate_module_paths() -> list[Path]:
    candidates: list[Path] = []
    for target_dir in _RUST_TARGETS:
        if not target_dir.exists():
            continue
        candidates.extend(
            [
                target_dir,
                *sorted(target_dir.glob("**")),
            ]
        )
    return candidates


def _ensure_extension_present() -> None:
    try:
        importlib.import_module("pdf_json_parser2_premium")
        return
    except ModuleNotFoundError:
        pass

    subprocess.run(
        ["cargo", "build", "--release"],
        cwd=_RUST_ROOT,
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _load_native_module():
    _ensure_extension_present()

    module_name = "pdf_json_parser2_premium"
    try:
        return importlib.import_module(module_name)
    except ModuleNotFoundError:
        pass

    for target_dir in _RUST_TARGETS:
        if not target_dir.exists():
            continue
        for path in sorted(target_dir.glob("*pdf_json_parser2_premium*")):
            if path.suffix not in {".so", ".pyd", ".dylib"}:
                continue
            spec = importlib.util.spec_from_file_location(module_name, str(path))
            if spec is None or spec.loader is None:
                continue
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)
            return module

    return None


def is_rust_available() -> bool:
    return _load_native_module() is not None


def clean_text(value: str) -> str:
    native = _load_native_module()
    if native is not None:
        return native.clean_text(value)
    return " ".join(str(value).split())


def filter_boundaries(values: Iterable[float], minimum: float, maximum: float) -> list[float]:
    native = _load_native_module()
    if native is not None:
        return native.filter_boundaries(list(values), minimum, maximum)
    return [float(v) for v in values if minimum <= float(v) <= maximum]


def validate_totals(items: Iterable[float], tax: float, total: float) -> bool:
    native = _load_native_module()
    if native is not None:
        return bool(native.validate_totals(list(items), float(tax), float(total)))

    subtotal = sum(float(value) for value in items)
    return abs((subtotal + float(tax)) - float(total)) < 0.01


def bloom_contains(key: str, fp: bytes | bytearray | list[int]) -> bool:
    native = _load_native_module()
    if native is not None:
        return bool(native.bloom_contains(key, list(fp)))
    if not fp:
        return False
    if isinstance(fp, (bytes, bytearray)):
        data = list(fp)
    else:
        data = list(fp)
    hashed = 0
    for byte in key.encode("utf-8"):
        hashed = (hashed * 131 + byte) & 0xFFFFFFFFFFFFFFFF
    index = hashed % len(data)
    return bool(data[index])
