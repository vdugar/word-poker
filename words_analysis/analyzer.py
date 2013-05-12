scores = [0, 1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10]
words = []
words_under_7 = []

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

with open("sowpods.txt") as f:
    words = f.readlines()

words = [word.strip() for word in words]


# Get words <= 7 letters in length
words_under_7 = [(word, word_score(word)) for word in words if len(word) <= 7 and len(word) != 0]

print "*******\n"

# Get max scoring word
max_scoring_word = max(words_under_7, key=lambda word: word[1])
print "Max Scoring Word: %s" % (max_scoring_word, )
print ""

# Figure out how many times a particular score appears
score_counts = [0] * (max_scoring_word[1] + 1)

for word in words_under_7:
    score_counts[word[1]] += 1

print "Score Counts:************"
for i, sc in enumerate(score_counts):
    print "Words with score %d: %d" % (i, sc)
print ""

# Figure out probabilities for a particular score
num_words = len(words_under_7)
score_probs = [(1.0 * sc / num_words) for sc in score_counts]
avg_score = 0

print "Score Probabilities:***********"
for i, sp in enumerate(score_probs):
    print "Probability of words with score %d: %f" % (i, 100 * sp)
    avg_score += i * sp
print ""

print "Average Score: %f" % avg_score

# Figure out cumulative probabilities
print "Cumulative Probabilities:***********"
csum = 0
prob_list = ""
for i, sp in enumerate(score_probs):
    csum += sp
    print "Words with score <= %d: %f %%" % (i, 100 * csum)

    # I know, string concatenation is bad, but what the heck
    prob_list += "%f, " % (csum)
print ""
print prob_list





