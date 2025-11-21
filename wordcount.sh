echo Chapters:
cat [0-9][0-9]*.md | ./strip-annotations.py | wc -w
echo Appendices:
cat A[0-9]*.md | ./strip-annotations.py | wc -w
echo 'Note that these counts do not include annotations, but do include [X; foo words] type things (due to inconvenience of removing them).'
