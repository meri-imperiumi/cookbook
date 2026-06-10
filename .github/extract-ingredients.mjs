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

const fileDir = resolve(import.meta.dirname, '../_recipes');
const dataDir = resolve(import.meta.dirname, '../_data');

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
            //.filter((file) => file.file === 'tofu-fried-rice.md')
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
        const ingredientsGrabber = /^[\s\xA0]*-\s*\[[\s\xA0]*([xX]?)[ \xA0]*\][\s\xA0]*(.*?)$/i;
        return files.map((file) => {
            const ingredients = file.contents
                .split('\n')
                .map((line) => {
                    return line.match(ingredientsGrabber);
                })
                .filter((match) => match)
                .map((ingredient) => ingredient[2]);
            return {
                ...file,
                ingredients,
            };
        });
    })
    .then((files) => {
        const removeConditionals = /\btai\b.*$/i;
        const removeMarkdown = /\[([^\]]+)\]\([^)]+\)/g
        //const ingredientsSplitter = /^((?:[\d.,-–—]+\s*[½⅓¼¾⅛⅝⅞]?|[½⅓¼¾⅛⅝⅞]+)(?:\s*(?:g|dl|l|ml|tl|rkl|kpl|pkt|prk|mg|kg|tbsp|tsp|cm))?)\s*(.*)$/i;
        const ingredientsSplitter = /^((?:[\d.,-–—]+\s*[½⅓¼¾⅛⅝⅞]?|[½⅓¼¾⅛⅝⅞]+)(?:\s*(?:g|dl|litraa|l|ml|tl|rkl|kpl|pkt|prk|mg|kg|tbsp|tsp|cm|kynttä|kynsi|annosta))?(?:\s*\(\d+g\))?)\s*(.*)$/i;
        return files.map((file) => {
            const ingredients = file.ingredients
                .map((line) => {
                    const cleanedLine = line
                        .replace(removeConditionals, "")
                        .replace(removeMarkdown, "$1")
                        .trim();
                    return ingredientsSplitter.exec(cleanedLine) || null;
                })
                .filter((match) => match)
                .map((match) => {
                    let quantity = match[1].trim().toLowerCase().replace(/\s*\(.*?\)\s*/g, '');
                    let item = match[2].trim().toLowerCase().replace(/\s*\(.*?\)\s*/g, '');
                    if (!item.length && quantity.indexOf(' ') !== -1) {
                        [quantity, item] = quantity.split(' ');
                    }
                    if (!item.length && quantity.length) {
                        item = quantity;
                        quantity = '';
                    }
                    return {
                        quantity: quantity.replace(/\s+/g, ' '),
                        item: item.replace(/\s*\(.*?\)\s*/g, ''),
                    };
                });
            return {
                ...file,
                ingredients,
            };
        });
    })
    .then((files) => {
        const ingredients = {};
        const staples = {};
        files.forEach((file) => {
            file.ingredients.forEach((ingredient) => {
                if (!ingredients[ingredient.item]) {
                    ingredients[ingredient.item] = {};
                }
                ingredients[ingredient.item][file.file] = ingredient.quantity;
                if (!file.frontmatter.tags || file.frontmatter.tags.indexOf('staples') === -1) {
                    return;
                }
                if (!staples[ingredient.item]) {
                    staples[ingredient.item] = {};
                }
                staples[ingredient.item][file.file] = ingredient.quantity;
            });
        });
        return {
            staples,
            ingredients,
        };
    })
    .then((result) => {
        const ingredients = result.staples;
        const categories = {};
        const sorted = Object.keys(ingredients).sort().reduce((acc, key) => (acc[key] = ingredients[key], acc), {});
        Object.keys(sorted).forEach((ingredient) => {
            let category = 'unknown';
            Object.keys(sorted[ingredient]).forEach((file) => {
                // Amounts can be indicative here
                if (sorted[ingredient][file].indexOf('tl') !== -1) {
                    category = 'spices';
                }
                if (sorted[ingredient][file].indexOf('dl') !== -1) {
                    category = 'cans';
                }
                if (sorted[ingredient][file].indexOf('200g') !== -1) {
                    category = 'cans';
                }
                if (sorted[ingredient][file].indexOf('400g') !== -1) {
                    category = 'cans';
                }
                if (sorted[ingredient][file].indexOf('cm') !== -1) {
                    category = 'freshies';
                }
            });

            if (ingredient.indexOf('juusto') !== -1) {
                category = 'cheeses';
            }
            if (ingredient.indexOf('öljy') !== -1) {
                category = 'oils';
            }
            if (ingredient.indexOf('hillo') !== -1) {
                category = 'condiments';
            }
            if (ingredient.indexOf('siirappi') !== -1) {
                category = 'condiments';
            }
            if (ingredient.indexOf('papu') !== -1) {
                category = 'dry-goods';
            }
            if (ingredient.indexOf('jauh') !== -1) {
                category = 'dry-goods';
            }
            if (ingredient.indexOf('jauhetta') !== -1) {
                category = 'spices';
            }
            if (ingredient.indexOf('sokeri') !== -1) {
                category = 'dry-goods';
            }
            if (ingredient.indexOf('tärkkelys') !== -1) {
                category = 'dry-goods';
            }
            if (ingredient.indexOf('kuiv') !== -1) {
                category = 'dry-goods';
            }
            if (ingredient.indexOf('linssej') !== -1) {
                category = 'dry-goods';
            }
            if (ingredient.indexOf('riisi') !== -1) {
                category = 'dry-goods';
            }

            // Special handling
            switch (ingredient) {
                case 'sipuli':
                case 'valkosipulia':
                case 'porkkanaa':
                case 'perunaa':
                case 'munaa':
                case 'ruisjuurta':
                case 'chili':
                    category = 'freshies';
                    break;
                case 'laakerinlehti':
                case 'vaniljasokeria':
                case 'kasvislientä':
                    category = 'spices';
                    break;
                case 'ketsuppia':
                case 'sinappia':
                case 'srirachaa':
                case 'balsamicoa':
                case 'sitruunamehua':
                    category = 'condiments';
                    break;
                case 'spagettia':
                case 'lasagnelevyä':
                case 'pastaa':
                case 'makaronia':
                case 'kermaa':
                case 'cashew-pähkinöitä':
                case 'manteleita':
                case 'kaljamaltaita':
                case 'kaurahiutaleita':
                case 'soijarouhetta':
                case 'maitojauhetta':
                    category = 'dry-goods';
                    break;
                case 'parmesania':
                case 'pecorinoa':
                case 'emmentalia':
                    category = 'cheeses';
                    break;
                case 'valkoviiniä':
                case 'olutta':
                case 'sherryä':
                case 'vettä':
                case 'maitoa':
                    category = 'drinks';
                    break;
            }

            if (!categories[category]) {
                categories[category] = [];
            }

            const used_in = Object
                .keys(sorted[ingredient])
                .map((file) => {
                    return {
                        file,
                        amount: sorted[ingredient][file],
                    };
                });

            categories[category].push({
                name: ingredient,
                used_in,
            });
        });
        return categories;
    })
    .then((categories) => {
        return writeFile(resolve(dataDir, './ingredients.yml'), dump(categories), 'utf-8');
    });
