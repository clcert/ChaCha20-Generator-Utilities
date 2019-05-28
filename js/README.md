# ChaCha20-Generator-Utilities
Uses the ChaCha20 implementation https://github.com/skeeto/chacha-js as a base for various functions related to random number generation.


## Instantiation and simple examples
First, make sure you've also included the base ChaCha20 implementation in 
order to be able to use the ChaChaRand object, like so:
```html
<script type="text/javascript" src="lib/chacha-js-skeeto/chacha.js"></script>
<script type="text/javascript" src="chacha20-generator.js"></script>
```


When instantiating, the seed should be a hexadecimal number represented by a string of 80 characters. 
It can be longer than that, but if it is the extra (rightmost) characters are ignored.

```js
let chacha = new ChaChaRand("5ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501");
// Get a float in [0, 1)
chacha.random()         // 0.47738372261817247
// Get some random bytes
chacha.getBytes(3)      // Uint8Array(3) [ 92, 49, 78 ]
// Get random bits represented as a number (a random integer in [0, 2^n - 1] where n is the argument given)
chacha.getRandBits(4)   // 9
// Reseed (essentially the same as creating an entirely new one with the new seed)
chacha.reseed("8ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501")

// This will act as if the seed were a string of 80 zeros (but also warn you about it)
let chacha0 = new ChaChaRand();
// Similarly, you can reseed with nothing (since you are explicitly seeding, no warning this time)
chacha.reseed();
```

