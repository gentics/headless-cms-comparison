# Deploy the SPA on GitHub Pages

Currently, these steps are necessary:

* cd spa
* npm install
* npm run build
* cd ..
* git rm -r docs
* mv spa/build docs/
* git add docs
* git commit
* git push

This will be done by GitHub Actions soonish...
