# ChaCha20-Generator-Utilities - Python
Uses the ChaCha20 implementation in pycryptodome https://pycryptodome.readthedocs.io/en/latest/ as a base for various functions related to random number generation.

The actual file is chacha20_generator.py inside the folder "clcert_chachagen", but we structured it this way to make use of setup.py and make the python version a proper package.

## Install package
```
$ pip install clcert_chachagen
```

## Examples
```python
import clcert_chachagen as chachagen

# Create a chacha object with a zeros seed
chacha_zero = chachagen.ChaChaGen()

# Create a chacha object with a seed (hexadecimal)
chacha = chachagen.ChaChaGen("5ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501")

# Get a float in [0, 1)
chacha.random()               # 0.47738372261817247               
# Get 3 random bytes
chacha.getbytes(3)            # b'\\1N'
# Get 5 random bits (an integer between 0 and 2^5 - 1)
chacha.getrandbits(5)         # 9
# Get a number between [1, 100]
chacha.randint(1, 100)        # 71
# Shuffle an array
chacha.shuffle([1,2,3,4])     # [4, 1, 3, 2]
# Get a single random element from an array
chacha.choice([1,2,3,4])      # 3
# Get an array of 5 elements from a given array. The elements could be repeated.
chacha.choices([1,2,3,4], 5)  # [4, 3, 1, 4, 4]       
# Get an array of 3 elements from a given array. The elements can't be repeated.
chacha.sample([1,2,3,4,5], 3) # [4, 5, 3]

# Reseed (essentially the same as creating an entirely new one with the new seed)
chacha.reseed("8ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501")
```
