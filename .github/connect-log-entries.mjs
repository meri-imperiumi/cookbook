import {
    readFile,
    writeFile,
    readdir,
} from 'node:fs/promises';
import {
    resolve,
    basename,
    extname,
    relative,
} from 'node:path';
import {
    load,
    dump,
} from 'js-yaml';
import slugify from 'slugify';

const noRecipe = [
    'not yet',
    'later',
    'coffee',
    'feta salad',
    'feta avocado salad',
    'salad',
    'sandwiches',
    'burgers',
];

const fileDir = resolve(import.meta.dirname, '../_recipes');
// FIXME: This obviously requires the repos to be on same level and with default names
const logDir = resolve(import.meta.dirname, '../../log/_logs')

readdir(fileDir)
    .then((files) => {
        return files.reduce((promise, file) => {
            return promise.then((results) => {
                return readFile(resolve(fileDir, `./${file}`), 'utf-8')
                    .then((contents) => {
                        return [...results, {
                            file,
                            contents,
                        }];
                    });
            });
        }, Promise.resolve([]));
    })
    .then((files) => {
        return files
            .map((file) => {
                const [head, frontmatter, contents] = file.contents.split('---\n');
                return {
                    ...file,
                    frontmatter: load(frontmatter),
                    contents,
                };
            })
            .filter((file) => file.contents);
    })
    .then((files) => {
        return readdir(logDir)
            .then((logFiles) => {
                return logFiles.reduce((promise, file) => {
                    return promise.then((results) => {
                        return readFile(resolve(logDir, `./${file}`), 'utf-8')
                            .then((contents) => {
                                return [...results, {
                                    file,
                                    contents,
                                }];
                            });
                    });
                }, Promise.resolve([]));
            })
            .then((logFiles) => {
                return logFiles
                    .map((file) => {
                        const [head, frontmatter, contents] = file.contents.split('---\n');
                        return {
                            ...file,
                            frontmatter: load(frontmatter),
                            contents,
                        };
                    })
                    .filter((file) => file.contents);
            })
            .then((logFiles) => {
                return {
                    files,
                    logFiles,
                };
            });
    })
    .then((results) => {
        const withLunch = results.logFiles.map((file) => {
            const matched = file.contents.match(/\sLunch:\s(.*)\n/);
            if (!matched) {
                return {
                    ...file,
                    lunch: null,
                };
            }
            return {
                ...file,
                lunch: matched[1].toLowerCase().trim(),
            };
        });
        return {
            ...results,
            logFiles: withLunch,
        };
    })
    .then((results) => {
        const withLunch = results.logFiles.filter((f) => f.lunch && !noRecipe.find((r) => f.lunch === r));
        const matched = [];
        const unmatched = [];
        withLunch.forEach((f) => {
            const slugified = slugify(f.lunch, {
                strict: true,
            });
            let match = null;
            results.files.forEach((recipe) => {
                if (basename(recipe.file, extname(recipe.file)) === slugified) {
                    // Direct filename match
                    match = recipe;
                    return;
                }
                if (recipe.frontmatter.title.toLowerCase().trim() === f.lunch) {
                    // Direct name match
                    match = recipe;
                    return;
                }
                if (recipe.frontmatter.aliases && recipe.frontmatter.aliases.length) {
                    const alias = recipe.frontmatter.aliases.find((alias) => alias.toLowerCase().trim() === slugified);
                    if (alias) {
                        match = recipe;
                        return;
                    }
                }
            });

            if (!match) {
                // This is a bit of a desperate attempt to see if the beginning matches. We do it last if everything else failed
                results.files.forEach((recipe) => {
                    if (slugified.indexOf(basename(recipe.file, extname(recipe.file))) === 0) {
                        match = recipe;
                        return;
                    }
                });
            }

            if (match) {
                matched.push({
                    ...f,
                    match,
                });
                return;
            }
            unmatched.push(f);
        });
        console.log(`${withLunch.length}/${results.logFiles.length} entries with lunch, ${matched.length} matched, ${unmatched.length} unmatched`);
        console.log('Unmatched:');
        unmatched.forEach((f) => {
            console.log(f.file, f.lunch);
        });
    });
