# Ubiquitous Language

## Öffentliche Inhalte

| Begriff | Definition | Zu vermeidende Aliase |
| ------- | ---------- | --------------------- |
| **Thema** | Ein automatisch gebildetes Bündel von Medienbeiträgen über dasselbe Ereignis oder denselben Sachverhalt. | Story, Geschichte, Radar-Eintrag |
| **Artikel** | Eine veröffentlichte, versionierte Zusammenfassung eines Themas auf kebab.news. | Story, Summary, Fassung |
| **Originalbeitrag** | Ein verlinkter Beitrag eines externen Mediums, der einem Thema zugeordnet ist. | Artikel, Quelle |
| **Quelle** | Der konkrete Beleg für eine Aussage; im Produkt meist ein Originalbeitrag oder eine darin erkennbare Primärquelle. | Outlet, Medium |
| **Medium** | Die veröffentlichende Organisation eines Originalbeitrags. | Publisher, Outlet, Quelle |
| **Quellenvergleich** | Die nach Medienperspektiven gruppierte Ansicht der Originalbeiträge eines Themas. | Radar |

## Analyse und Transparenz

| Begriff | Definition | Zu vermeidende Aliase |
| ------- | ---------- | --------------------- |
| **Zusammenfassung** | Der kurze und ausführliche, quellengebundene Inhalt eines Artikels. | Neutrale Fassung |
| **Framing-Hinweis** | Eine vorsichtige, belegte Einordnung möglicher Wirkung von Wortwahl oder Auslassung. | Framing-Bewertung |
| **Blindstelle** | Eine im Quellenvergleich nicht vertretene Perspektivgruppe. | Fehlende Wahrheit |
| **Prüfstatus** | Die sichtbare Angabe, ob ein Artikel redaktionell geprüft wurde. | Qualitätssiegel |

## Beziehungen

- Ein **Thema** enthält mehrere **Originalbeiträge**.
- Ein **Originalbeitrag** gehört zu genau einem **Medium**.
- Ein **Thema** kann keinen oder genau einen aktuell veröffentlichten **Artikel** haben.
- Ein **Artikel** besitzt eine oder mehrere **Quellen** und kann mehrere Versionen haben.
- Der **Quellenvergleich** gehört zu einem **Thema**, die **Zusammenfassung** zu einem **Artikel**.

## Beispiel-Dialog

> **Dev:** „Was sieht man unter **Themen**?“
>
> **Domain-Expertin:** „Den **Quellenvergleich**: Originalbeiträge verschiedener Medien, ihre Schlagzeilen und mögliche Blindstellen.“
>
> **Dev:** „Und wann verlinken wir auf einen **Artikel**?“
>
> **Domain-Expertin:** „Sobald für das Thema eine veröffentlichte Zusammenfassung existiert. Der Link heißt dann konsequent ‚Artikel lesen‘.“
>
> **Dev:** „Nennen wir das Themenbündel im Frontend noch Story oder Radar?“
>
> **Domain-Expertin:** „Nein. Das sind interne oder alte Begriffe; für Leser heißt es **Thema**.“

## Markierte Mehrdeutigkeiten

- „Artikel“ bezeichnete sowohl externe Medienbeiträge als auch kebab.news-Zusammenfassungen. Externe Inhalte heißen künftig **Originalbeiträge**, kebab.news-Veröffentlichungen **Artikel**.
- „Story“, „Geschichte“ und „Thema“ bezeichneten dasselbe Quellenbündel. Im sichtbaren Produkt gilt ausschließlich **Thema**.
- „Radar“ bezeichnete zugleich eine Route, eine Seite und den Quellenvergleich. Sichtbar heißt die Seite **Themen**, ihre Funktion **Quellenvergleich**.
- „Quelle“, „Publisher“, „Medium“ und „Outlet“ wurden teilweise gleichgesetzt. Das **Medium** veröffentlicht; der **Originalbeitrag** ist sein konkreter Beitrag; die **Quelle** belegt eine Aussage.
- „Neutrale Fassung“ widerspricht dem Transparenzversprechen. Der kanonische Begriff ist **Artikel** oder, wenn der Textteil gemeint ist, **Zusammenfassung**.
