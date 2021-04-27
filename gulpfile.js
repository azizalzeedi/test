const { src, dest } = require('gulp');

function copy() {
  return src([
    './views/*',
    './src/**/*.md',
    './src/**/*.png',
    './src/bot/telegram/locales/*'], { base: '.' })
    .pipe(dest('./build/'));
}


exports.copy = copy;
exports.default = copy;
