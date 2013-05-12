package misc

import (
	"fmt"
	"os"
)

var ROOT_DIR = ""

func SetupEnvironment() bool {
	ROOT_DIR = os.Getenv("TYWA_ROOT")
	if ROOT_DIR != "" {
		return true
	} else {
		fmt.Println("Environment variable 'TYWA_ROOT' is not set. Please set it to the root directory of the TYWA codebase.")
		return false
	}
	return false
}

func GetRootDir() string {
	return ROOT_DIR
}
