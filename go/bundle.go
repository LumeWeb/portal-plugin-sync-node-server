package node_server

import _ "embed"

//go:embed bundle.zip
var bundle []byte

func GetBundle() []byte {
	return bundle
}
