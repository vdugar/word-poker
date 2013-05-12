scores = [0, 1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10]
tile_bag = [
    ('E', 12),
    ('A', 9),
    ('I', 9),
    ('O', 8),
    ('N', 6),
    ('R', 6),
    ('T', 6),
    ('L', 4),
    ('S', 4),
    ('U', 4),
    ('D', 4),
    ('G', 3),
    ('B', 2),
    ('C', 2),
    ('M', 2),
    ('P', 2),
    ('F', 2),
    ('H', 2),
    ('V', 2),
    ('W', 2),
    ('Y', 2),
    ('K', 1),
    ('J', 1),
    ('X', 1),
    ('Q', 1),
    ('Z', 1), 
]

""" Heap method of extracting random tiles from this distribution """
import random
import sys

class Node:
    # Each node in the heap has a weight, value, and total weight.
    # The total weight, self.tw, is self.w plus the weight of any children.
    def __init__(self, w, v, tw):
        self.w, self.v, self.tw = w, v, tw

def rws_heap(items):
    h = [None]
    for v, w in items:
        h.append(Node(w, v, w))

    # Initialize total weights
    for i in range(len(h) - 1, 1, -1):
        h[i>>1].tw += h[i].tw
    return h

def rws_heap_pop(h):
    # Imagine you have a finite amount of gas to zoom past elements!

    gas = h[1].tw * random.random()

    i = 1
    while gas > h[i].w:
        gas -= h[i].w
        # See if we have enough gas to move past first child
        i <<= 1
        if gas > h[i].tw:
            gas -= h[i].tw
            i += 1  # move to next child, skipping this one's descendants

    v = h[i].v

    # recalibrate the weights
    h[i].w -= 1
    while i:
        h[i].tw -= 1
        i >>= 1

    return v
""" End of heap method """

def word_score(word):
    word = word.upper()
    score = 0
    for c in word:
        try:
            score += scores[ord(c) - 64]
        except:
            print word
            return

    return score

def check_word(word, letters):
    """ Checks if the given sorted string contains the given letters """
    j = 0
    wl = len(word)
    for lt in letters:
        while word[j] != lt:
            j += 1
            if j == wl:
                return False
        j += 1
        if j == wl:
            return False

    return True


with open("sowpods.txt") as f:
    words = f.readlines()
f.close()

words = [word.strip() for word in words]


# Get words <= 7 letters in length
words_under_7 = [(word, word_score(word)) for word in words if len(word) <= 7 and len(word) != 0]

# Get words of 7 letters
words_of_7 = [word[0] for word in words_under_7 if len(word[0]) == 7]

"""
# Form a large list of 5-letter strings from the scrabble distribution
N_ITERATIONS = 1000000
strings = []
for i in xrange(N_ITERATIONS):
    heap = rws_heap(tile_bag)
    s = ""
    for j in range(5):
        s += rws_heap_pop(heap)
    strings.append(''.join(sorted(s)))

# Get unique strings
strings = set(strings)

# Dump these to a file
f = open("strings", "w")
for s in strings:
    f.write("%s\n" % s)
f.close()
"""

# Sort every 7-letter word
sorted_words_7 = [''.join(sorted(word)) for word in words_of_7]

with open("strings") as f:
    strings = f.readlines()
f.close()
strings = [s.strip() for s in strings]

# Now, let's form the word-sets we want
# For every string in our set of random strings, get all the 7-letter words that have these letters
begin = int(sys.argv[1])
end = int(sys.argv[2])
smap = {}
for s in strings[begin:end]:
    smap[s] = []
    for i, word in enumerate(sorted_words_7):
        if check_word(word, s):
            smap[s].append(words_of_7[i])
    if len(smap[s]) < 4:
        del(smap[s])


print len(smap.keys())

# Output the string-word combinations to a file
f = open("dict" + str(end), "w")
for s, words in smap.iteritems():
    f.write("%s: %s\n" % (s, ','.join(words)))
f.close()



