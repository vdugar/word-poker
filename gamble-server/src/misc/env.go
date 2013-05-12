package misc

import (
	"os/user"
)

//var ROOT_DIR = "/Users/vdugar/code/TYWA/"
var ROOT_DIR = ""

func GetRootDir() string {
	user, _ := user.Current()
	userName := user.Username
	switch userName {
	case "adhandhania":
		ROOT_DIR = "/Users/adhandhania/Developer/tywa/"
	case "vdugar":
		ROOT_DIR = "/Users/vdugar/code/TYWA/"
	}
	return ROOT_DIR
}
