---
title: Meri-Imperiumin keittokirja
cssclasses:
  - bases-no-toolbar
---
- [Ruokareseptit](Ruokareseptit.base)
- [Jälkiruoat](Jälkiruoat.base)

Keittokirja sisältää reseptejä joita käytämme Lille Ø:n merimatkoilla. Reseptit ovat pääasiassa kasvispohjaisia ja perustuvat pitkään säilyviin ja helposti veneessä pidettäviin raaka-aineisiin.

## Perusruoat

Mitä ruokaa tekisi tänään? Tässä reseptejä joihin veneessä pitäisi aina olla ainekset. Nämä eivät vaadi esivalmisteluja:
```base
filters:
  and:
    - file.folder == "_recipes"
    - file.hasTag("staples")
views:
  - type: cards
    name: Recipes
    filters:
      and:
        - '!file.tags.contains("soak")'
        - '!file.tags.contains("elaborate")'
        - '!file.tags.contains("dessert")'
    groupBy:
      property: category
      direction: ASC
    order:
      - title
    image: note.cover
    cardSize: 140
    imageAspectRatio: 0.6

```

Jos pohdit huomista ruokaa, tässä on esivalmisteluja vaativia:
```base
filters:
  and:
    - file.folder == "_recipes"
    - file.hasTag("staples")
    - file.hasTag("soak")
views:
  - type: cards
    name: Recipes
    filters:
      and:
        - '!file.tags.contains("dessert")'
    order:
      - title
	image: note.cover
    cardSize: 140
    imageAspectRatio: 0.6
```

## Kovan sään sapuskat

Tässä on ruokia pahan päivän varalle.
```base
filters:
  and:
    - file.folder == "_recipes"
    - file.hasTag("staples")
    - file.hasTag("storm")
views:
  - type: cards
    name: Recipes
    filters:
      and:
        - '!file.tags.contains("dessert")'
    order:
      - title
	image: note.cover
    cardSize: 140
    imageAspectRatio: 0.6
```

## Kevyen sään ruoat

Meri on tyyni ja Parasailor vetää. Jos on aikaa kokata rauhassa.
```base
filters:
  and:
    - file.folder == "_recipes"
    - file.hasTag("staples")
    - file.hasTag("elaborate")
views:
  - type: cards
    name: Recipes
    filters:
      and:
        - '!file.tags.contains("dessert")'
    order:
      - title
	image: note.cover
    cardSize: 140
    imageAspectRatio: 0.6
```
