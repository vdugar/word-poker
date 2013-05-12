"""
Uses the strings we generated to prepare a list of tiles that can be dealt to users
"""

import itertools

with open("dict") as f:
    strings = f.readlines()
f.close()

f = open("tiles", "w")

for s in strings:
	tile_row = []
	s = s.strip()

	# Extract the 5 community tiles
	comm = list(s[0:5])
	tile_row.extend(comm)

	# Extract the list of words
	words = s[7:].split(',')

	# Pick 4 random words
	words = list(itertools.combinations(words, 4))[0]
	
	# Extract the unique (!= community) letters from each
	# There coule be multiple occurrences of the same letter, so 
	# we need to keep track of the count
	for word in words:
		repeat_letter_map = {}
		comm_count = {} 	# Counts the number of occurrences of this letter in the list of community tiles
		for letter in word:
			if letter not in comm:
				# Unique letter
				tile_row.append(letter)
			elif (letter in repeat_letter_map) and (repeat_letter_map[letter] > 0):
				# We've encountered this letter multiple times
				repeat_letter_map[letter] += 1
				if repeat_letter_map[letter] > comm_count[letter]:
					tile_row.append(letter)
			elif letter not in repeat_letter_map:
				# this is the first time we've encountered this
				comm_count[letter] = comm.count(letter)
				repeat_letter_map[letter] = 1

	# Print out the tiles
	tiles_string = ','.join(tile_row)
	tiles_string += "\n"
	f.write(tiles_string)

f.close()
