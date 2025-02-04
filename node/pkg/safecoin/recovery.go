package safecoin

import (
	"bufio"
	"fmt"
	"net/http"
	"strings"
	"time"
)

var recoveryDate = time.Date(2021, time.October, 5, 11, 0, 0, 0, time.UTC)

// TODO(Victor): Change the URL of recovery.cfg file
const recoveryConfigUrl = `https://raw.githubusercontent.com/certusone/wormhole/dev.v2/node/pkg/safecoin/recovery.cfg`

func fetchRecoveryConfig() ([]string, error) {
	resp, err := http.Get(recoveryConfigUrl)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("non-200 return code when fetching recovery config: %d", resp.StatusCode)
	}

	scanner := bufio.NewScanner(resp.Body)
	accs := make([]string, 0)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "#") || line == "" {
			continue
		}
		accs = append(accs, line)
	}

	return accs, nil
}
