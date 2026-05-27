with open('index.html', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')
content = content.replace('\u672c\u65e5\u306e\u958b\u20681\u5834', '\u672c\u65e5\u306e\u958b\u50ac\u5834')
content = content.replace('&#38283;&#20681;&#22580;', '&#38283;&#20851;&#22580;')
content = content.replace('&#20551;', '&#20851;')
content = content.replace('&#20681;', '&#20851;')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
