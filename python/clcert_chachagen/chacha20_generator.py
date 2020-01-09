import math
from Crypto.Cipher import ChaCha20

'''
For ChaChaGen.prototype.random():
Source https://github.com/davidbau/seedrandom/blob/released/seedrandom.js
--------------------------------------------------------------------------
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
'''

def _zero_fill_right_shift(val, n):
    return (val >> n) if val >= 0 else ((val + 0x100000000) >> n)


class ChaChaGen:

    def __init__(self, seed='00'*40):
        self.zeros = bytes.fromhex('00' * 64)
        self.reseed(seed)

    def reseed(self, seed='00'*40):
        self.seed = seed
        self.key = bytes.fromhex(seed[0:64])
        self.iv = bytes.fromhex(seed[64:80])
        self.cipher = ChaCha20.new(key=self.key, nonce=self.iv)
        self._rand_block = self.cipher.encrypt(self.zeros)
        self._next_byte_index = 0;
        self._block_counter = 1;

    def generated_blocks_count(self):
        return self._block_counter

    def used_bits_count(self):
        return self._next_byte_index*8 + ((self._block_counter - 1)*(64*8))

    def _new_rand_block(self):
        self._rand_block = self.cipher.encrypt(self.zeros)
        self._next_byte_index = 0;
        self._block_counter += 1;

    def getbytes(self, n):
        end_index = self._next_byte_index + n
        ret = self._rand_block[self._next_byte_index:end_index]
        self._next_byte_index += n
        # If the current block wasn't enough, then:
        while len(ret) < n:
            missing = n - len(ret)
            self._new_rand_block()
            old_ret = ret
            new_bytes = self._rand_block[:missing]
            ret = old_ret + new_bytes
            self._next_byte_index = missing
        return ret

    def getbyte(self):
        return self.getbytes(1)

    def getrandbits(self, nbits):
        needed_bytes = math.ceil(nbits / 8)
        bytes = self.getbytes(needed_bytes)
        ret = 0
        extra_bits = nbits % 8
        bitmask = (1<<extra_bits) - 1 if extra_bits else -1
        ret = bytes[0] & bitmask
        for i in range(1, needed_bytes):
            ret *= 256
            ret += bytes[i]
        return ret

    def _randuint(self, max):
        maxbits = math.floor(math.log2(max)) + 1
        ret = self.getrandbits(maxbits)
        while ret > max:
            ret = self.getrandbits(maxbits)
        return ret

    def randint(self, min, max):
        return self._randuint(max - min) + min

    def random(self):
        width = 256
        chunks = 6
        digits = 52
        startdenom = pow(width, chunks)
        significance = pow(2, digits)
        overflow = significance * 2
        n = self.getrandbits(chunks*8)
        d = startdenom
        x = 0
        while n < significance:
            n = (n + x) * width
            d *= width
            x = self.getrandbits(8)
        while n >= overflow:
            n /= 2
            d /= 2
            x = _zero_fill_right_shift(x, 1)
        return (n + x) / d

    def _fisher_yates(self, arr, steps=None):
        n = len(arr)
        complete = (steps is None)
        if complete:
            steps = n - 1
        if steps <= 0 or steps > (n - 1):
            pass
        j = n
        selections = 0
        while selections < steps:
            k = self._randuint(j - 1)
            aux = arr[k]
            arr[k] = arr[j - 1]
            arr[j - 1] = aux
            j -= 1
            selections += 1
        return arr if complete else arr[(n - steps):][::-1]

    def shuffle(self, arr):
        return self._fisher_yates(arr)

    def sample(self, arr, sample_size, order_matters=True):
        n = len(arr)
        if sample_size <= 0 or sample_size > n:
            pass
        indices = [i for i in range(n)]
        indices_sample = []
        if sample_size == n:
            if order_matters:
                self.shuffle(indices)
                indice_sample = indices[::-1]
            else:
                indices_sample = indices
        elif sample_size <= n/2 or order_matters:
            indices_sample = self._fisher_yates(indices, sample_size)
        else:
            anti_size = n - sample_size
            anti_sample = self._fisher_yates(indices, anti_size)
            aux_set = {}
            for i in range(anti_size):
                aux_set[anti_sample[i]] = True
            for i in range(n):
                try:
                    aux_set[i]
                except KeyError:
                    indices_sample.append(i)
        return [arr[i] for i in indices_sample]

    def choice(self, arr):
        n = len(arr)
        chosen = self._randuint(n - 1)
        return arr[chosen]

    def choices(self, arr, choices_size):
        n = len(arr)
        if choices_size <= 0 or choices_size > (n - 1):
            pass
        res = []
        for i in range(choices_size):
            chosen = self._randuint(n-1)
            res.append(arr[chosen])
        return res
