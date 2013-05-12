package misc

import (
	"net/http"
	"strings"
)

func SetCookie(w http.ResponseWriter, name string, value string) {
	cookie := &http.Cookie{
		Name:  name,
		Value: value,
		Path:  "/",
	}
	http.SetCookie(w, cookie)
}

func UnsetCookie(w http.ResponseWriter, r *http.Request, name string) {
	cookieValue := GetCookie(r, name)
	if cookieValue != "" {
		SetCookie(w, name, "")
	}
}

func GetCookie(r *http.Request, name string) string {
	cookiesString := r.Header.Get("Cookie")
	cookies := strings.Split(cookiesString, "; ")
	for _, c := range cookies {
		kv := strings.Split(c, "=")
		if kv[0] == name {
			return kv[1]
		}
	}
	return ""
}
