install:
	npm install

css:
	lessc style.less > style.css
	./node_modules/autoprefixer/autoprefixer style.css

watch:
	#npm install -g watchy
	watchy -w style.less -- make css
