package tywa

import (
	log "code.google.com/p/log4go"
	"io/ioutil"
	"misc"
	"net/http"
	"strings"
)

const NUM_LETTERS = 26

const BHL_API_KEY = "f4b13cb17ec4325bcc90982ea5243344"
const BHL_API_URL = "http://words.bighugelabs.com/api/2/"

const DICT_SERVER = "http://localhost:8080/"

func ValidateWords(words []string) map[string]bool {
	url := DICT_SERVER
	for i, w := range words {
		if i == 0 {
			url += "?"
		} else {
			url += "&"
		}

		url += "word=" + w
	}

	response, err := http.Get(url)
	if err != nil {
		log.Debug("ERROR: %s", err)
		return nil
	} else {
		if response.StatusCode == 200 {
			bs, _ := ioutil.ReadAll(response.Body)
			respStr := string(bs)
			resp := make(map[string]bool)
			parts := strings.Split(respStr, ",")
			for i, v := range parts {
				if v == "1" {
					resp[words[i]] = true
				} else {
					resp[words[i]] = false
				}
			}
			return resp
		}
	}
	return nil
	//	fmt.Println(word, "does not exist.")
}

func WordExists(word string) bool {
	log.Debug("Validating word: %s", word)
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
				log.Debug(word, "exists.")
				return true
			}
		}
	}
	log.Debug(word, "does not exist.")
	return false
}

func WordExistsBHL(word string) bool {
	url := BHL_API_URL + BHL_API_KEY + "/" + word + "/json"
	response, err := http.Get(url)
	if err != nil {
		log.Debug("ERROR: %s", err)
		return false
	} else {
		if response.StatusCode == 200 {
			return true
		} else {
			return false
		}
	}
	return false
}

func WordScore(word string) int {
	score := 0
	letterIndex := 0
	for _, l := range word {
		letterIndex = int(l) - 96
		score += letterScore(letterIndex)
	}

	return score
}

func letterScore(letterIndex int) int {
	scores := []int{0, 1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10}
	return scores[letterIndex]
}

// distribution of letters
func InitHandSets(sets []*HandSet) []*HandSet {
	b, err := ioutil.ReadFile(misc.GetRootDir() + HANDSETS_FILE)
	if err != nil {
		log.Debug(err)
	}

	lines := strings.Split(string(b), "\n")
	handSets := make([]*HandSet, 0, len(lines))
	for i, l := range lines {
		if i >= NUM_HANDSETS {
			break
		}
		// Empty line occurs at the end of the file when we use Split.
		if len(l) == 0 {
			continue
		}

		letters := strings.Split(l, ",")
		numLettersRequired := NUM_CARDS_COMMUNITY + MAX_PLAYERS*NUM_CARDS_PLAYER
		if len(letters) < numLettersRequired {
			log.Debug("Insufficient letters passed. We need at least", numLettersRequired, "letters.")
		} else {
			hs := &HandSet{
				community: make([]string, 0, NUM_CARDS_COMMUNITY),
				players:   make([]([]string), 0, MAX_PLAYERS),
			}
			hs.community = letters[:MAX_PLAYERS+1]
			letters = letters[MAX_PLAYERS+1:]

			for i := 0; i < MAX_PLAYERS; i++ {
				p_letters := letters[:NUM_CARDS_PLAYER]
				letters = letters[NUM_CARDS_PLAYER:]
				hs.players = append(hs.players, p_letters)
			}
			handSets = append(handSets, hs)
		}
	}
	return handSets
}
