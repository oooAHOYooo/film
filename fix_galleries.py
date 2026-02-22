import json
import re

with open('data/summer.json', 'r') as f:
    data = json.load(f)

# we have new links
new_links = [
"https://i.pinimg.com/736x/86/1d/a0/861da06065b2fb93a0aa73b309e71fa4.jpg",
"https://i.pinimg.com/736x/c3/85/e4/c385e4b2d4e2a36fcc64f66203043869.jpg",
"https://i.pinimg.com/1200x/eb/e6/92/ebe6925f656f46b9949494127f784f62.jpg",
"https://i.pinimg.com/736x/b2/3d/97/b23d9733c52356371d54b41e6b7e122b.jpg",
"https://i.pinimg.com/736x/e8/3a/01/e83a01fe07090ce5b36dd30938e7192a.jpg",
"https://i.pinimg.com/1200x/7d/b1/94/7db1943e5f0b3f5b0161cf523e5a92a9.jpg",
"https://i.pinimg.com/736x/96/04/05/96040513d62a856e1d8b1fc43c9376a4.jpg",
"https://i.pinimg.com/736x/7b/63/10/7b6310ffa978421dbc1daf8766ded931.jpg",
"https://i.pinimg.com/736x/9c/68/10/9c6810a721d82e3a30636affc1bcb704.jpg",
"https://i.pinimg.com/1200x/ab/8d/8f/ab8d8f9249de41d4c893aa1919343fec.jpg",
"https://i.pinimg.com/736x/9b/1f/c2/9b1fc2140151a5b4bc39ef14c992e659.jpg",
"https://i.pinimg.com/736x/03/be/c5/03bec53a7a772258a93e44897f6d0c75.jpg",
"https://i.pinimg.com/736x/ef/03/bc/ef03bc26c7721484cd5e949090605c08.jpg",
"https://i.pinimg.com/1200x/9f/6a/82/9f6a825c8229ec6b756b344605187eb7.jpg"
]

for url in new_links:
    data['inspiration'].append({
        "url": url,
        "title": "Pinterest Inspo " + str(len(data['inspiration'])),
        "description": ""
    })

# The user wants the entire gallery reversed, so the most recent is up top.
data['inspiration'].reverse()

with open('data/summer.json', 'w') as f:
    json.dump(data, f, indent=2)

# Now update table-read.html
html_items = []
for item in data['inspiration']:
    url = item['url']
    html_items.append(f'                                <div class="inspiration-item"><img\n                                                src="{url}"\n                                                alt="Inspiration" loading="lazy"></div>')

with open('pages/summer/table-read.html', 'r') as f:
    html = f.read()

# Replace the gallery content
start_tag = '<div class="inspiration-gallery">'
end_tag = '</section>'
start_idx = html.find(start_tag) + len(start_tag)
# We find the closing div of the gallery which is just before the section end
end_idx = html.find('                        </div>', start_idx)

new_gallery_html = '\n' + '\n'.join(html_items) + '\n'

new_html = html[:start_idx] + new_gallery_html + html[end_idx:]

with open('pages/summer/table-read.html', 'w') as f:
    f.write(new_html)

print("Done")
