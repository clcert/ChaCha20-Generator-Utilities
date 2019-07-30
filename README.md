# ChaCha20-Generator-Utilities
Uses the ChaCha20 implementation https://github.com/skeeto/chacha-js as a base for various functions related to random number generation.


## Using the ChaChaGen object
### Instantiation and basic functions
First, make sure you've also included the base ChaCha20 implementation in 
order to be able to use the ChaChaGen object, like so:
```html
<script type="text/javascript" src="lib/chacha-js-skeeto/chacha.js"></script>
<script type="text/javascript" src="chacha20-generator.js"></script>
```


When instantiating, the seed should be a hexadecimal number represented by a string of 80 characters. 
It can be longer than that, but if it is the extra (rightmost) characters are ignored.

```js
let chacha = new ChaChaGen("5ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501");
// Get a float in [0, 1)
chacha.random();         // 0.47738372261817247

// Get some random bytes
chacha.getBytes(3);      // Uint8Array(3) [ 92, 49, 78 ]

// Get random bits represented as a number (a random integer in [0, 2^n - 1] where n is the argument given)
chacha.getRandBits(4);   // 9

// Reseed (essentially the same as creating an entirely new one with the new seed)
chacha.reseed("8ee5e2327a68a9db8a78efdaa855d102ed8bf14e128e0a72ae1c9d72e5f9747e27479f21dfbfd501")

// This will act as if the seed were a string of 80 zeros (but also warn you about it)
let chacha0 = new ChaChaGen();
// >>/!\ No seed given. Please note no random seed values are provided by default, so not passing a seed 
//       creates the same object as if it had been initialized with a string of 80 '0's concatenated together.

// Similarly, you can reseed with nothing (since you are explicitly seeding, no warning this time)
chacha.reseed();
```

### Numbers in a range
This library offers two functions to get an integer number in a given range, 
chosen at random and without bias.
```js
let chacha = new ChaChaGen("e7a183352f974ac5e9f0f8e338fdd6ca8532f991f528afe9e11b5950a1a972efaf9a688df858b47f"); 

// Get an integer in [0, max]
chacha.randUInt(10);        // 8 
chacha.randUInt(100);       // 57

// Get an integer in [min, max] (it's just using randUint internally)
chacha.randInt(-5, 5);      // -4
chacha.randInt(100, 300);   // 106
```

### Functions for sequences
There are also some utilty functions to perform certain sequence-related tasks.

Choice/s are very simple, unbiased "get a random element from..." functions.
```js
let arr = [1,2,3,4,5,6,7,8,9,10];
let chacha = ChaChaGen("7e9f69ff98b482bb680629e4ebb789dd39ddc379aba440e6fd0f0bd8b30c094a3c8234822b93355b");

// Get a random element from the given array
chacha.choice(arr);       // 9
// Get an array of the given size made of random elements of the given array, with replacement
chacha.choices(arr, 5);   // Array(5) [ 6, 8, 8, 8, 3 ]
chacha.choices(arr, 12);  // Array(12) [ 1, 2, 1, 7, 7, 3, 10, 1, 7, 10, 7, 5 ]
```

Shuffling is provided via an implementation of the Fisher-Yates algorithm.  
Do note, the given array is actually shuffled, meaning it's an in-place algorithm.
```js
let arr = [1,2,3,4,5,6,7,8,9,10];
let chacha = ChaChaGen("308cbbc031b33d428108d8986d8b29c9c5dcdf3dc10511337b1f26249d55357f5143707cf290e3ce");

// Shuffle arr in place.
chacha.shuffle(arr);     //
console.log(arr);        // Array(10) [ 7, 9, 5, 10, 1, 2, 6, 4, 3, 8 ]
``` 

Unbiased sampling without replacement is also provided. The sample function of 
this library takes first an array from which to sample elements, and then 
the sample size, but it also has an optional boolean parameter, which 
we call `orderMatters`. This lets you tell the function whether 
you care about the order in which the elements are returned being random 
or not (in either case, the returned value is an array of sample elements).

When `orderMatters`, treated as `true` by default, is truthy, then you can 
treat the returned sample as an array where the elements have been sequentially 
chosen at random from the array passed to the function. If `orderMatters` isn't truthy, 
then the function can use less entropy (i.e. less internal calls to 
getBytes()) in the case where the size of the requested sample is more 
than half the length of the array you're sampling from, but the order of the returned 
sample will be biased to the original order in which the elements came from (it's still 
unbiased in terms of which elements become part of the sample).
In this last case it's best to treat the sample as if you had taken a handful 
of random elements from the array all at the same time.
```js
let pool = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
let chachaRandomSeq = new ChaChaGen("8cb6c51f5a49b1d00ace88023947fe795daf6a69be151a6b3d4bdea7c0db543521f115a1dff49264");
let chachaHandful = new ChaChaGen("8cb6c51f5a49b1d00ace88023947fe795daf6a69be151a6b3d4bdea7c0db543521f115a1dff49264");
// (same seed for both of these ChaChaGen instantiations)

// How many random bytes have been used by each ChaChaGen object since they were last seeded?
chachaRandomSeq.usedBytesCount();      // 0
chachaHandful.usedBytesCount();        // 0

// Sequentially sample 13 random elements from the given array
let samp1 = chachaRandomSeq.sample(pool, 13)
// samp1 = [12, 3, 20, 2, 15, 10, 14, 4, 9, 5, 13, 1]

// Get a sample in which the sampling order doesn't matter
let samp2 = chachaHandful.sample(pool, 13, false)
// samp2 = [1, 4, 5, 6, 7, 8, 9, 11, 13, 16, 17, 18]

// Comparing amounts of bytes used to produce these results
chachaRandomSeq.usedBytesCount();       // 18
chachaHandful.usedBytesCount();         // 8
```


## Limitations
#### `getRandBits(n)` won't work if `n` is bigger than 53:  
In ES6, 2<sup>53</sup>-1 is defined as [MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER), 
the maximum integer number before there is a loss in precision and number 
values become ambiguous. This loss of precision, in a way, introduces biases 
to number generation and can produce results different from the expected 
results of the number generation algorithms, so we choose to simply not let 
`getRandBits` go beyond the safe, precise, limit for JavaScript integers. 

Note that `randUint`, `randInt`, `shuffle`, `sample` and `choice/s` all, 
whether directly or indirectly, make calls to `getRandBits`. 

In order to deal with this, we recommend requesting smaller numbers, or 
requesting the desired randomness directly with `getBytes`, and using, for 
example, [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
(as it says in the MDN Web Docs, BigInt is currently in stage 3 of the 
ECMAScript specification, meaning it's an approved candidate proposal, 
but not yet finished) to construct numbers bigger than `MAX_SAFE_INTEGER`.

For example, if we want to get a precise 54 bits number, we can do so by 
constructing a 54 bits BigInt from concatenating one 1 bit BigInt at the 
end of a 53 bits BigInt, like so this:
```js
let bigFragment1 = BigInt(Number.MAX_SAFE_INTEGER);   // 9007199254740991n
let bigFragment2 = BigInt(1);                         // 1n
let big = bigFragment1*BigInt(2) + bigFragment1       // 18014398509481983n

```
 

#### Beware of how JavaScript does bitwise operations:  
Although this is not a limitation of the library itself, it may be worth it 
to caution users who might want to use the results of `getRandBits` or `getBytes` and perform 
bitwise operations on them, that JavaScript's bitwise operations work with 32 bit ints, 
and use ToInt32() on their operands internally, even though 
JavaScript's numbers may be bigger than that. In practical terms, it means 
you can't just do bitwise operations with big numbers the same way you'd 
do them with small numbers and that scenarios like this might happen:
```js
2**33 >> 1      // result: 0
(2**32-1)>>>1   // result: 2147483647
(2**33-1)>>>1   // result: 2147483647 again
``` 