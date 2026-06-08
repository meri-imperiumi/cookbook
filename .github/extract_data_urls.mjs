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

const fileDir = resolve(import.meta.dirname, '../_recipes');
// Extract image link from file as Google Docs exports it
const regexp = /\[image([0-9])\]: <data:(.*)>/g
// From https://github.com/killmenot/valid-data-url/blob/master/index.js
const dataUrlRegexp = /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i;


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
        // Ignore files without data-url
        return files.filter((file) => {
            return file.contents.match(regexp);
        });
    })
    .then((files) => {
        return files.reduce((promise, file) => {
            return promise.then((results) => {
                const match = regexp.exec(file.contents);
                if (!match) {
                    return results;
                }
                const dataUrl = `data:${match[2]}`.trim().match(dataUrlRegexp);
                const mediatype = dataUrl[1] || 'text/plain';
                if (mediatype.indexOf('image/') !== 0) {
                    return results;
                }
                const base64 = dataUrl[dataUrl.length - 1];
                const buffer = Buffer.from(base64, 'base64');
                const suffix = mediatype.split('/')[1];
                const filename = resolve(fileDir, `../files/${basename(file.file, extname(file.file))}.${suffix}`);
                return writeFile(filename, buffer)
                    .then(() => {
                        // We have extracted the image, now replace it in Markdown
                        const filepath = relative(fileDir, filename);
                        const withoutAttachment = file.contents.replace(`[image${match[1]}]: <data:${match[2]}>`, '');
                        let newContent = withoutAttachment.replace(`[image${match[1]}]`, `(${filepath})`).trim();
                        newContent = `---\ncover: ${filepath}\n---\n${newContent}`;
                        return writeFile(resolve(fileDir, `./${file.file}`), newContent, 'utf-8')
                            .then(() => [...results, file.file]);
                    });
            });
        }, Promise.resolve([]));
    })
    .then((processed) => {
        console.log('Processed files');
        processed.forEach((file) => {
            console.log(file);
        });
    });
