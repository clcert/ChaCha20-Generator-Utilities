# ChaCha20-Generator-Utilities - Python
Uses the ChaCha20 implementation in pycryptodome https://pycryptodome.readthedocs.io/en/latest/ as a base for various functions related to random number generation.

The actual file is chacha20_generator.py inside the folder "clcert_chachagen", but we structured it this way to make use of setup.py and make the python version a proper package.

## Requirements
```
$ pip install -r requirements.txt
```

## Examples
```python
# Create a chacha object with a seed (hexadecimal)
chacha = ChaChaRand("5ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501")

# Create a chacha object with a zeros seed
chacha_zero = ChaChaRand()

# Get a float in [0, 1)
chacha.random()          # 0.47738372261817247
# Get some random bytes
chacha.getbytes(3)      # b'z5\xd1'
# Get a number between [0, 100]
chacha.randint(100)     # 53
# Reseed (essentially the same as creating an entirely new one with the new seed)
chacha.reseed("8ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501")
```
