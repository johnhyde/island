annocount() {
  name="${2:-$1}" #use 1 as name unless 2 is provided
  cat "$1" | ./strip-annotations.py | wc -w | tr -d '\n'
  printf "\t$name\n"
}

echo Chapters:
for x in [0-9][0-9]*.md
do
  annocount "$x"
done
#this is hard to abstract to the function because of glob reasons:
cat [0-9][0-9]*.md | ./strip-annotations.py | wc -w | tr -d '\n'
printf "\ttotal\n"
echo Appendices:
cat A[0-9]*.md | ./strip-annotations.py | wc -w
# With regards to getting a more-specific count of these... eh... who cares...
echo 'Note that these counts do not include annotations, but do include [X; foo words] type things (due to inconvenience of removing them).'
