# Player SHOUTCast and Icecast HTML5
### Responsive web player with lyrics for SHOUTCast and Icecast streaming. 

Thanks to [@andreas5232](https://github.com/andreas5232) for add Icecast support.

![Responsive Web Player for SHOUTCast and Icecast](https://i.imgur.com/x2NP8K8.png)

## Required:
- PHP >= 5.3
- cURL

## Installation
- Just put the files in your server
- **Configure your player in the file *config.js* in the *root***
    - Set the name of your web radio
    - Set your streaming URL (without `/` in the end)
    - Set your API key of Vagalume for the lyrics([See how to get your API key](https://api.vagalume.com.br/docs/))

### HTML5 Player for SHOUTCast and Icecast streamings with info like:
- Current song
- Historic of played songs (Not tested in SHOUTCast V1)
- Cover art of the current song ([iTunes API](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/))
- Lyrics of the current song ([Vagalume API](https://api.vagalume.com.br/docs/))
- Responsive design

## Keyboard Controls 
- `M` - mute/unmute
- `P` and `space` - play/pause
- `arrow up` and `arrow down` - increase/decrease volume
- `0 to 9` - volume percent