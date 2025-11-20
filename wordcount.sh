echo Chapters:
cat [0-9][0-9]*.md | ./strip-annotations.py | wc -w
echo Appendices:
cat A[0-9]*.md | ./strip-annotations.py | wc -w
echo Note that these counts do NOT include annotations 🙂
