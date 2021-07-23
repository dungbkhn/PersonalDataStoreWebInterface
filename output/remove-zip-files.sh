mv ./zipout.zip ./zipout_$(($(date +%s%N)/1000000)).zip
find ./output -name "zi*" -type f -delete
