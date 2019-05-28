# ChaCha20-Generator-Utilities
Uses the ChaCha20 implementation https://github.com/skeeto/chacha-js as a base for various functions related to random number generation.


## Instantiation and simple examples
First, make sure you've also included the base ChaCha20 implementation in 
order to be able to use the ChaChaRand object, like so:
```html
<script type="text/javascript" src="lib/chacha-js-skeeto/chacha.js"></script>
<script type="text/javascript" src="chacha20-generator.js"></script>
```


When instantiating, the seed should be a hexadecimal number represented by a string of at least 80 characters. 
If it's longer, then the extra characters are ignored.

```js
let chacha = new ChaChaRand("5ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501");
// Get a float in [0, 1)
chacha.random()         // 0.47738372261817247
// Get some random bytes
chacha.getBytes(3)      // Uint8Array(3) [ 92, 49, 78 ]
// Get random bits represented as a number (a random integer in [0, 2^n - 1] where n is the argument given)
chacha.getRandBits(4)   // 9

// This will act as if the seed were a string of 80 zeros
let chacha0 = ChaChaRand();

```

