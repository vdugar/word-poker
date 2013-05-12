package gow

import (
	log "code.google.com/p/log4go"
	"io/ioutil"
	"math/rand"
	"net/http"
)

const DICT_SERVER = "http://localhost:8080/"

func WordExists(word string) bool {
	//	return true

	//	log.Debug("Validating word: %s", word)
	url := DICT_SERVER + "?word=" + word
	response, err := http.Get(url)
	if err != nil {
		log.Debug("ERROR: %s", err)
		return false
	} else {
		if response.StatusCode == 200 {
			bs, _ := ioutil.ReadAll(response.Body)
			respStr := string(bs)
			if respStr == "1" {
				log.Debug("'%s' exists.", word)
				return true
			}
		}
	}
	log.Debug("'%s' does not exist.", word)
	return false
}

func wordScore(word string) int {
	score := 0
	letterIndex := 0
	for _, l := range word {
		letterIndex = int(l) - 96
		score += letterScore(letterIndex)
	}

	return score
}

func shuffleLetters(numLetters int) []string {
	perm := rand.Perm(numLetters)
	/*	resp := make([]string, 0, numLetters)
		for _, i := range perm {
			resp = append(resp, ithLetter(i+1))
		}
	*/
	log.Debug(perm)

	resp := make([]string, 0, numLetters)
	resp = []string{"s", "i", "n", "o", "h", "m", "e", "n", "r", "a", "i", "y", "l", "p", "r", "c", "b", "j", "l", "o", "w", "l", "f", "e", "m", "t", "i", "a", "e", "i", "k", "a", "t", "s", "i", "n", "o", "h", "m", "e", "n", "r", "a", "i", "y", "l", "p", "r", "c", "b", "j", "l", "o", "w", "l", "f", "e", "m", "t", "i", "a", "e", "i", "k", "a", "t", "s", "i", "n", "o", "h", "m", "e", "n", "r", "a", "i", "y", "l", "p", "r", "c", "b", "j", "l", "o", "w", "l", "f", "e", "m", "t", "i", "a", "e", "i", "k", "a"}
	return resp
}

func letter(i int) string {
	letters := []string{"", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"}
	return letters[i]
}

func letterScore(letterIndex int) int {
	scores := []int{0, 1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10}
	return scores[letterIndex]
}

func letterCount(l int) int {
	tiles := []int{0, 9, 2, 2, 4, 12, 2, 3, 2, 9, 1, 1, 4, 2, 6, 8, 2, 1, 6, 4, 6, 4, 2, 2, 1, 2, 1}
	if l < len(tiles) {
		return tiles[l]
	}
	return 0
}

func ithLetter(i int) string {
	lc := []int{0, 9, 2, 2, 4, 12, 2, 3, 2, 9, 1, 1, 4, 2, 6, 8, 2, 1, 6, 4, 6, 4, 2, 2, 1, 2, 1}
	//	lc := []int{0, 18, 4, 4, 8, 24, 4, 6, 4, 19, 2, 2, 8, 4, 12, 16, 4, 2, 12, 8, 12, 8, 4, 4, 2, 4, 2} // double the set
	for l, c := range lc {
		i -= c
		if i <= 0 {
			return letter(l)
		}
	}
	//	log.Debug("i = ", i)
	return "!"
}

// TEMP FUNCTIONS
func getBonusWords() [][]string {
	bonusWords := [][]string{
		{
			"trash",
			"stand",
		},
		{
			"talk",
			"snob",
		},
	}
	return bonusWords
}
