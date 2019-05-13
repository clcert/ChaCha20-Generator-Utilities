/**
 * Interface to https://github.com/skeeto/chacha-js that will use a hex string as a seed for
 * the key and IV. 32 byte key, 8 byte IV, 8 byte internal counter initialized to 0.
 *
 * The seed is assumed to be a 320 bits hex number represented by an 80 characters long string
 * if it's longer, then it truncates it to its first 80 characters and discards the rest.
 */

// Quick function to get a hex string as an array of bytes
// thanks https://stackoverflow.com/a/50868276/4192226
function fromHexString (hexString) {
  return new Uint8Array(hexString.match(/.{1,2}/g).map(function(byte){return parseInt(byte, 16);}));
}
// Maybe I should throw this one as a ChaChaRand.range() so it doesn't accidentally screw with other people's code?
function myRange(start, stop, step) {
  let a = [start], b = start;
  while (b < stop) {
    a.push(b += step || 1);
  }
  return a;
}
const ChaChaRand = function(seed) {
  this.reseed(seed);
};
// TODO make some sort of validateNum(num,max,min...) or something to streamline number validation and throw errors?
ChaChaRand.CHACHA_BLOCK = 64; // bytes
// Max number of bits one can request as number before asking values in a range where there's a loss of precision
ChaChaRand.MAX_SAFE_BITS = Math.log2(Number.MAX_SAFE_INTEGER);

// Reseed. Note the current block (if existent) is entirely lost once you csll reseed.
ChaChaRand.prototype.reseed = function(seed) {
  // TODO validate the seed is actually a hex string
  let keyHexSize = CHACHA_KEYSIZE*2;
  let ivHexSize = CHACHA_IVSIZE*2;
  let seedSize = keyHexSize+ivHexSize;
  if(seed.length < seedSize) {
    throw new Error("Seed should be a hex string at least seedSize characters long")
  }
  this._seed = seed.substr(0, seedSize);
  this._key = fromHexString(seed.substr(0, keyHexSize));
  this._iv = fromHexString(seed.substr(keyHexSize, ivHexSize));
  // Actually, I guess ^those don't need to be stored as instance variables, but I'll leave them for now just in case.
  this._chacha = new ChaCha(this._key.buffer, this._iv.buffer);
  // Get the first block right away (64 byte array buffer, turned into Uint8Array)
  this._randBlock = new Uint8Array(this._chacha());
  // Index of the next unused byte in the block
  this._nextByteIndex = 0;
  this._blockCounter = 1;
};
//     (reseed would be practically the same as creating a new ChaChaRand with a new seed though, so it's whatever?)

// How many blocks has this generator produced so far with its seed? (each block is 64 bytes)
ChaChaRand.prototype.generatedBlocksCount = function() {
  return this._blockCounter;
};
// How many bits have been requested. Somewhat ill defined in that the block may be generated as the chacha's state
// well before any bytes are requested via getByte(s).
ChaChaRand.prototype.usedBitsCount = function() {
  return this._nextByteIndex*8 + ((this._blockCounter-1)*(ChaChaRand.CHACHA_BLOCK*8));
};

// Get a new block from the underlying chacha20 implementation.
// Throws "output exhausted" if chacha20 has cycled through its counter values.
ChaChaRand.prototype._newRandBlock = function() {
  // TODO handle the "output exhausted" error, and also... what should we do there?
  this._randBlock = new Uint8Array(this._chacha());
  this._blockCounter++;
  this._nextByteIndex = 0;
};

// Get the amount of bytes specified TODO see todo below
ChaChaRand.prototype.getBytes = function(n) {
  // TODO (maybe?) throw an error if proceeding would cause an "output exhausted" error
  if(isNaN(n) || n<=0){
    throw new Error("Invalid number given (must be a positive number)");
  }
  let endIndex = this._nextByteIndex + n;
  let ret = this._randBlock.slice(this._nextByteIndex, endIndex);
  this._nextByteIndex += n;
  // If the current block wasn't enough, then:
  while(ret.length < n) {
    // amount of bytes we still need
    let missing = n - ret.length;
    this._newRandBlock();
    let old_ret = ret;
    let new_bytes = this._randBlock.slice(0, missing);
    ret = new Uint8Array(old_ret.length + new_bytes.length);
    // Merging bytes from the old block with bytes from the new one
    ret.set(old_ret);
    ret.set(new_bytes, old_ret.length);
    this._nextByteIndex = missing;
  }
  return ret;
};

ChaChaRand.prototype.getByte = function() {
  return this.getBytes(1);
};

// get a random positive number in [0 , 2**(nbits-1)), up to MAX_SAFE_BITS bits
// TODO explain somewhere how js is weird about bitwise operators, to warn users against the int32 conversion
ChaChaRand.prototype.getRandomBitsAsNum = function (nbits) {
  if(nbits > ChaChaRand.MAX_SAFE_BITS || nbits < 1) {
    throw new Error(`Requested invalid number of bits. Safe bits to represent are in [0,${ChaChaRand.MAX_SAFE_BITS}]`);
  }
  let neededBytes = Math.ceil((nbits)/8);
  let bytes = this.getBytes(neededBytes);
  let ret = 0;
  // bits that didn't consume an entire byte
  let extraBits = nbits%8;
  let bitmask = extraBits?((1<<extraBits)-1):-1;
  // TODO recycle unused bits? I mean, asking for 1 single bit costs as much randomness as asking for a whole byte here
  ret = bytes[0] & bitmask;
  for(let i = 1; i < neededBytes; i++) {
    // should optimize by using bit shifts when nbits is small enough that working with int32 numbers is ok?
    ret *= 256;
    ret += bytes[i];
  }
  return ret;
};

// Get a ramdom number in [0, max]
ChaChaRand.prototype.getRandomUInt = function(max) {
  if(!max || max < 0) {
    // I realise that if max===0 I can just return 0 right away instead, but if someone's asking for that,
    // I feel like there's probably some error in their code somewhere. And with "someone" I mean me.
    throw Error("Provide a positive max value for the number to be generated");
  }
  // TODO if max >= Number.MAX_SAFE_INTEGER should probably throw some error (which could be ignored via a second arg?)
  let maxbits = Math.floor(Math.log2(max))+1;
  let ret = this.getRandomBitsAsNum(maxbits);
  while(ret > max) {
    ret = this.getRandomBitsAsNum(maxbits);
  }
  return ret;
};

// Rand in [min, max]
ChaChaRand.prototype.getRandomIntInRange = function(min, max) {
  return this.getRandomUInt(max - min) + min;
};


// For the following function:
// Source https://github.com/davidbau/seedrandom/blob/released/seedrandom.js
/*
Copyright 2014 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// This function returns a random double in [0, 1) that contains
// randomness in every bit of the mantissa of the IEEE 754 value.
ChaChaRand.prototype.getRandomFloat = function() {
  // David Bau's code and comments, but replacing RC4 with ChaCha20. Also replaced "math" with "Math" and var with let
  // The following constants are related to IEEE 754 limits.
  let width = 256,        // each ChaCha20 output is 0 <= x < 256
      chunks = 6,         // at least six ChaCha20 outputs for each double
      digits = 52,        // there are 52 significant digits in a double
      startdenom = Math.pow(width, chunks),
      significance = Math.pow(2, digits),
      overflow = significance * 2;
  let n = this.getRandomBitsAsNum(chunks*8),   // Start with a numerator n < 2 ^ 48
      d = startdenom,                          //   and denominator d = 2 ^ 48.
      x = 0;                                   //   and no 'extra last byte'.
  while (n < significance) {                   // Fill up all significant digits by
    n = (n + x) * width;                       //   shifting numerator and
    d *= width;                                //   denominator and generating a
    x = this.getRandomBitsAsNum(8);            //   new least-significant-byte.
  }
  while (n >= overflow) {                      // To avoid rounding up, before adding
    n /= 2;                                    //   last byte, shift everything
    d /= 2;                                    //   right using integer math until
    x >>>= 1;                                  //   we have exactly the desired bits.
  }
  return (n + x) / d;                           // Form the number within [0, 1).
};


// Fisher Yates shuffle, but it can be stopped after the given number of steps, and if so
// it returns only the last 'steps' elements of the shuffled array (so it can be used for random sampling)
// Note it's in-place so it rearranges the list you give it
ChaChaRand.prototype._FisherYates = function(arr, steps) {
  let n = arr.length;
  let complete = steps===undefined;
  if(complete) {
    // If no 'steps' argument is given, do a complete shuffle. A shuffle is completed after n-1 steps, but
    // someone can also potentially choose steps=n-1 with the intention of getting a sample of n-1 random elements.
    steps = n-1;
  }
  if (steps <= 0 || steps > (n-1)) {
    throw "Invalid 'steps' value. The number of steps should be positive and no more than the array's length - 1";
  }
  // let peeps = myRange(1,n);
  let j = n, selections = 0;
  while(selections < steps) {
    let k = this.getRandomUInt(j-1);
    // Exchanging arr_k with arr_(j-1)
    let aux = arr[k];
    arr[k] = arr[j - 1];
    arr[j - 1] = aux;
    j--;
    selections++;
  }
  // "reverse" because that way the sample is ordered from first chosen to last chosen.
  return (complete?arr:arr.slice(n - steps).reverse());
};

// Fisher Yates shuffle. Shuffles in place, so arr is modified.
ChaChaRand.prototype.shuffle = function(arr) {
  this._FisherYates(arr);
  // return arr; commented because it's in place and a return value might make you think it's not.
};


// Reservoir sampling. Note it returns indices, not arr's contents. Used to be the base for sample()
// but I replaced it with the stoppable Fisher-Yates method... not deleting it just yet just in case
ChaChaRand.prototype._reservoirSampling = function(arr, sampleSize) {
  let n = arr.length;
  if(sampleSize <= 0 || sampleSize>=n) {
    // Could also throw if sampleSize = 1, because you can just use some vanilla rand number function in that case.
    throw Error("Sample size must be a number between 1 and one less than the array size");
  }
  // this all's straight from wiki =P
  let reservoir = [];
  // fill the reservoir array
  for(let i = 0; i < sampleSize; i++) {
    reservoir.push(i);
  }
  // replace elements with gradually decreasing probability
  for(let i = sampleSize; i < n; i++){
    let rando = this.getRandomUInt(i);
    if(rando < sampleSize) {
      reservoir[rando] = i;
    }
  }
  return reservoir;
};

// Random sample of arr (objects from the sample are the same as the ones in the original array given).
// Setting orderMatters to false allows the function to use less entropy when sampleSize > arr.length/2
// but the resulting list will have the chosen elements appearing in their original order.
ChaChaRand.prototype.sample = function(arr, sampleSize, orderMatters) {
  if(orderMatters===undefined){
    // If orderMatters, the returned list can be used when you want to *sequentially* choose sampleSize random elements
    // from arr. If it doesn't we can do an entropy optimization, which will be biased to be ordered so that
    // the indices are in their original order, so we only do this when the sample's order doesn't matter.
    orderMatters=true;
  }
  let n = arr.length;
  if (sampleSize<= 0 || sampleSize > (n-1)) {
    // That's right, no sampleSize===n... same reasoning as to why randomUInt throws on max===0 to be honest.
    throw "Invalid sample size. The sample size should be positive and no more than the array's length - 1";
  }
  // In this case we don't want to shuffle the list, so we avoid that by working over indices instead:
  let indices = myRange(0,n-1);
  let indicesSample = [];
  if(sampleSize <= (n/2) || orderMatters) {
    indicesSample = this._FisherYates(indices, sampleSize);
  }
  else{
    // In this case you can choose a sample of n - sampleSize and then return the ones you didn't choose...
    // why do that? because the smaller the sample size the less iterations of the _FisherYates loop,
    // which means less entropy used.
    let antiSize = n-sampleSize;
    let antiSample = this._FisherYates(indices,antiSize);
    // An .includes based loop to get which elements aren't in antiSample feels n^2 inefficient, so let's try:
    let auxSet = {};
    for(let i = 0; i < antiSize; i++){
      auxSet[antiSample[i]] = true;
    }
    for(let i = 0; i < n; i++) {
      // === is me being overly paranoid of missing a bug because I checked for truthy values instead of "true"
      if(auxSet[i]===true){continue;}
      // If the index wasn't part of the anti sample, then it's part of the actual sample
      indicesSample.push(i);
    }
    // use the indices to get the actual elements:
  }
  return indicesSample.map(function(index){return arr[index];});
};
