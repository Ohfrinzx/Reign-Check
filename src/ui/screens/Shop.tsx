import type { GameState } from '../../game/types';
import type { ShopItemDef } from '../../game/content/shop';
import { KIND_LABEL, KIND_NOTE, SHOP_MAP } from '../../game/content/shop';
import { buyLimit, canAfford, isActRoom, priceLine, roomIsClosed, shopHeading, shopPrice } from '../../game/shop';
import { termsIn } from '../../game/glossary';
import { fill } from '../../game/text';
import { usd } from '../../game/economy';

/**
 * THE BACK ROOM — the shop, rendered as the day's last document.
 *
 * Every offer states its price AND its catch in plain text on the card
 * itself. Nothing required to make the decision is behind a hover
 * (ground rule 11) or below the fold — the "leave" action lives in the top
 * strap, same as every other screen's primary action (ground rule 9).
 */
export function ShopScreen({
  s, onBuy, onLeave,
}: {
  s: GameState;
  onBuy: (id: string) => void;
  onLeave: () => void;
}) {
  const stock = s.shopStock.map((id) => SHOP_MAP[id]).filter(Boolean);
  const big = isActRoom(s);
  const head = shopHeading(s);
  const boughtTonight = s.log.filter((l) => l.day === s.day && l.kind === 'purchase');
  const closed = roomIsClosed(s);
  const oneOnly = buyLimit(s) === 1;

  const glossaryTerms = termsIn(
    stock.flatMap((d) => [d.name, d.seller, d.upside, d.downside ?? '', priceLine(s, d)]),
  );

  return (
    <div className="doc-wrap">
      <div className={`shop ${big ? 'big' : ''}`}>
        <div className="shop-head">
          <div className="kicker">
            {big ? 'After the vote' : 'After hours'} &middot; Day {s.day}
          </div>
          <h1>{head.title}</h1>
          <div className="shop-sub">{fill(head.sub, s)}</div>
          <div className="shop-purse">
            In the account: <b>{usd(s.stats.treasury)}</b>
            <span className="limit">
              {oneOnly
                ? ' · One thing a night. Choose.'
                : ' · Tonight you may take as much as you can pay for.'}
            </span>
          </div>
        </div>

        {stock.length === 0 && s.shopBuysTonight === 0 && (
          <div className="empty">
            Nobody came tonight. Whatever you were going to be offered, you were
            not offered it.
          </div>
        )}
        {stock.length === 0 && s.shopBuysTonight > 0 && oneOnly && (
          <div className="shop-closed">
            The room is done with you. The other two offers go back in the bag
            and you will not see them again tonight.
          </div>
        )}

        <div className="shop-grid">
          {stock.map((def, i) => (
            <Offer key={def.id} s={s} def={def} index={i} onBuy={onBuy} closed={closed} />
          ))}
        </div>

        {boughtTonight.length > 0 && (
          <div className="shop-receipt">
            <div className="kicker">Tonight you took</div>
            {boughtTonight.map((l, i) => (
              <div className="line" key={i}>
                <span className="n">{l.title}</span>
                <span className="v">{l.text}</span>
              </div>
            ))}
          </div>
        )}

        {glossaryTerms.length > 0 && (
          <div className="card-glossary">
            {glossaryTerms.map((t) => (
              <span key={t.term}><b>{t.term}</b>: {t.def}</span>
            ))}
          </div>
        )}

        <div className="shop-foot">
          <button className="btn btn-primary" onClick={onLeave}>
            Leave and begin Day {s.day + 1} →
          </button>
          <span className="note">Nothing here is compulsory. Or press Enter.</span>
        </div>
      </div>
    </div>
  );
}

function Offer({
  s, def, index, onBuy, closed,
}: {
  s: GameState;
  def: ShopItemDef;
  index: number;
  onBuy: (id: string) => void;
  closed: boolean;
}) {
  const price = shopPrice(s, def);
  const affordable = canAfford(s, def) && !closed;
  const short = Math.max(0, price - s.stats.treasury);

  return (
    <div className={`offer ${def.rarity} ${affordable ? '' : 'broke'}`}>
      <div className="offer-top">
        <span className="k">{KIND_LABEL[def.kind]}</span>
        {def.rarity === 'rare' && <span className="rare-tag">Rare · no catch</span>}
        {def.rarity === 'uncommon' && <span className="unc-tag">Uncommon</span>}
        <span className="num">{index + 1}</span>
      </div>
      <h2>{def.name}</h2>
      <div className="seller">{fill(def.seller, s)}</div>

      <div className="line up">
        <span className="tag">What you get</span>
        {fill(def.upside, s)}
      </div>
      {def.downside ? (
        <div className="line down">
          <span className="tag">The catch</span>
          {fill(def.downside, s)}
        </div>
      ) : (
        <div className="line none">
          <span className="tag">The catch</span>
          None. That is why it is expensive.
        </div>
      )}

      <div className="offer-foot">
        <div className="price">
          <span className={price < 0 ? 'pays' : ''}>{priceLine(s, def)}</span>
          <span className="kn">{KIND_NOTE[def.kind]}</span>
        </div>
        <button
          className="btn btn-primary"
          disabled={!affordable}
          onClick={() => onBuy(def.id)}
        >
          {price < 0 ? 'Take it' : 'Buy'}
        </button>
      </div>
      {!affordable && (
        <div className="locked">✕ You are {usd(short)} short.</div>
      )}
    </div>
  );
}

/** Advisors, policies and unspent favours — shown in the right rail all run. */
export function Pocket({
  s, onUseFavour,
}: {
  s: GameState;
  onUseFavour: (id: string) => void;
}) {
  const owned = s.owned.map((id) => SHOP_MAP[id]).filter(Boolean);
  const favours = s.heldFavours.map((id) => SHOP_MAP[id]).filter(Boolean);
  if (!owned.length && !favours.length) return null;

  const canSpend = s.phase === 'briefing' || s.phase === 'stage' || s.phase === 'night';

  return (
    <div className="panel">
      <h3>Back Room {(owned.length + favours.length) > 0 && <span>{owned.length + favours.length}</span>}</h3>

      {owned.map((def) => (
        <div className="kept" key={def.id}>
          <div className="n">{def.name}</div>
          <div className="d">{def.upside}</div>
          {def.downside && <div className="c">{def.downside}</div>}
        </div>
      ))}

      {favours.map((def) => (
        <div className="kept fav" key={def.id}>
          <div className="n">{def.name}</div>
          <div className="d">{def.use?.label ?? def.upside}</div>
          <button
            className="btn"
            disabled={!canSpend}
            onClick={() => onUseFavour(def.id)}
            title={canSpend ? 'Spend this favour now' : 'Finish the current item first'}
          >
            Spend it
          </button>
        </div>
      ))}
    </div>
  );
}
