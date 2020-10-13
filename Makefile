install:
	make install
	make css

install:
	npm install
	npm install --global autoprefixer-cli
	npm install --global less
	npm install --global http-server
	npm install --global watch

css:
	lessc styles/style.less > style.css
	autoprefixer-cli style.css

watch:
	make css
	watch "make css" styles --wait=1

serve:
	http-server ./ -p 8083