const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const shell = require('gulp-shell');
const yaml = require('js-yaml');

gulp.task('lint:javascript', () => gulp.src([
  './source/js/**/*.js',
  './scripts/**/*.js'
]).pipe(eslint())
  .pipe(eslint.format()));

gulp.task('lint:stylus', shell.task([
  'npx stylint ./source/css/'
]));

gulp.task('validate:config', cb => {
  const themeConfig = fs.readFileSync(path.join(__dirname, '_config.yml'));

  try {
    yaml.safeLoad(themeConfig);
    return cb();
  } catch (error) {
    return cb(new Error(error));
  }
});

gulp.task('validate:i18n', cb => {
  const languagesPath = path.join(__dirname, 'languages');
  const languages = fs.readdirSync(languagesPath);
  const errors = [];

  languages.forEach(lang => {
    const languagePath = path.join(languagesPath, lang);
    try {
      yaml.safeLoad(fs.readFileSync(languagePath), {
        filename: path.relative(__dirname, languagePath)
      });
    } catch (error) {
      errors.push(error);
    }
  });

  return errors.length === 0 ? cb() : cb(errors);
});

gulp.task('update:i18n', shell.task([
  'read -p "Enter Crowdin project-key: " KEY',
  'TMPFILE=`mktemp`',
  'curl "https://api.crowdin.com/api/project/theme-next/export?key=$KEY"',
  'wget "https://api.crowdin.com/api/project/theme-next/download/all.zip?key=$KEY" -O $TMPFILE',
  'unzip -j -o $TMPFILE -d languages',
  'rm $TMPFILE',
].join(';')));

gulp.task('test', gulp.series('lint:javascript', 'validate:config', 'validate:i18n'));
gulp.task('update', gulp.series('update:i18n', 'validate:i18n'));
