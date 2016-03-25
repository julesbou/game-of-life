install:
	npm install

css:
	lessc style.less > style.css
	autoprefixer-cli style.css

watch:
	#npm install -g watchy
	watchy -w style.less -- make css
