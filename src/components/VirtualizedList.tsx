import React from 'react';
import { List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  listHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: any }) => React.ReactElement;
  width?: string | number;
}

interface RowProps {
  items: any[];
  renderItem: (props: { index: number; style: React.CSSProperties; data: any }) => React.ReactElement;
}

const RowComponent = ({
  index,
  style,
  items,
  renderItem,
  ariaAttributes,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
} & RowProps) => {
  return (
    <div style={style} {...ariaAttributes}>
      {renderItem({ index, style: {}, data: items[index] })}
    </div>
  );
};

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  itemHeight,
  listHeight,
  renderItem,
  width = '100%',
}) => {
  if (!items || items.length === 0) {
    return <div className="p-4 text-center text-slate-500">Aucun élément à afficher</div>;
  }

  return (
    <List<RowProps>
      rowCount={items.length}
      rowHeight={itemHeight}
      rowComponent={RowComponent}
      rowProps={{ items, renderItem }}
      style={{ height: listHeight, width }}
      className="scrollbar-thin scrollbar-thumb-slate-200"
    />
  );
};

